import { supabase } from "../../supabase/config.js";

document.addEventListener("DOMContentLoaded", loadHires);

async function loadHires() {
  const { data: { user } } = await supabase.auth.getUser();
  const container = document.getElementById("hiresList");
  
  if (!user) {
    container.innerHTML = "<p class='error'>You must log in first.</p>";
    return;
  }

  // Show loading state
  container.innerHTML = "<div class='loading'>Loading your active projects...</div>";

  // Fetch hires where this user is the freelancer
  const { data: hires, error } = await supabase
    .from("hires")
    .select(`
      id,
      created_at,
      jobs(title, description),
      users!hires_client_id_fkey(full_name),
      contracts(status)
    `)
    .eq("freelancer_id", user.id);

  if (error) {
    container.innerHTML = "<p class='error'>Error loading projects. Please try again.</p>";
    console.error(error);
    return;
  }

  // Filter active hires (not all contracts completed)
  const activeHires = (hires || []).filter(hire => {
    // No contracts yet → keep it
    if (!hire.contracts || hire.contracts.length === 0) return true;

    // Check if all contracts are completed
    const allCompleted = hire.contracts.every(c => c.status === "completed");
    return !allCompleted;
  });

  if (!activeHires || activeHires.length === 0) {
    container.innerHTML = `
      <div class="empty-hires">
        <h3>All Projects Completed! 🎉</h3>
        <p>You have no active projects requiring preview submissions.</p>
        <p>Great work! All your projects are either completed or awaiting new milestones.</p>
      </div>
    `;
    return;
  }

  // Update active count
  document.getElementById('activeCount').textContent = activeHires.length;

  // Render hires
  container.innerHTML = '<div class="hires-grid"></div>';
  const hiresGrid = container.querySelector('.hires-grid');

  activeHires.forEach((hire, index) => {
    const hireCard = document.createElement("div");
    hireCard.className = "hire-card";
    hireCard.style.animationDelay = `${index * 0.1}s`;
    
    hireCard.innerHTML = `
      <div class="hire-header">
        <h3 class="hire-title">${hire.jobs.title}</h3>
        <span class="hire-status">Active</span>
      </div>
      
      <div class="hire-client">
        <strong>Client:</strong> ${hire.users.full_name}
      </div>
      
      <div class="hire-description">
        ${hire.jobs.description}
      </div>
      
      <div class="hire-actions">
        <button class="btn-submit-preview" data-id="${hire.id}">
          Submit Preview
        </button>
      </div>
      
      <div class="preview-form" id="form-${hire.id}">
        <div class="form-instructions">
          <strong>📸 Important:</strong> Take a valid screenshot of your project milestone (not the full project). 
          This helps clients track progress and provide feedback.
        </div>
        
        <div class="file-upload-wrapper">
          <div class="file-input-wrapper">
            <input type="file" id="file-${hire.id}" accept="image/*,.pdf" />
          </div>
          <button class="btn-upload-preview" data-id="${hire.id}">
            Upload Preview
          </button>
        </div>
        
        <div class="supported-formats">
          Supported formats: JPG, PNG, PDF (Max: 10MB)
        </div>
      </div>
      
      <div class="hire-meta">
        <span class="hire-date">Started: ${new Date(hire.created_at).toLocaleDateString()}</span>
        <span class="hire-id">#${hire.id}</span>
      </div>
    `;
    
    hiresGrid.appendChild(hireCard);
  });

  // Show form toggle
  document.querySelectorAll(".btn-submit-preview").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const hireId = e.target.dataset.id;
      const form = document.getElementById(`form-${hireId}`);
      form.classList.toggle("active");
      
      // Update button text
      if (form.classList.contains("active")) {
        e.target.innerHTML = "👁️ Hide Preview Form";
      } else {
        e.target.innerHTML = "👁️ Submit Preview";
      }
    });
  });

  // Handle uploads
  document.querySelectorAll(".btn-upload-preview").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const hireId = e.target.dataset.id;
      const fileInput = document.getElementById(`file-${hireId}`);
      const file = fileInput.files[0];
      
      if (!file) {
        alert("Please select a file before uploading.");
        return;
      }
      
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB.");
        return;
      }
      
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert("Please upload only JPG, PNG, or PDF files.");
        return;
      }
      
      await submitPreview(hireId, file);
    });
  });
}

async function submitPreview(hireId, file) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert("Please login to submit preview.");
    return;
  }

  // Show loading state on button
  const button = document.querySelector(`.btn-upload-preview[data-id="${hireId}"]`);
  const originalText = button.innerHTML;
  button.innerHTML = '📤 Uploading...';
  button.disabled = true;

  // Upload file to storage
  const path = `previews/${hireId}/${Date.now()}-${file.name}`;
  const { error: upErr } = await supabase.storage.from("submissions").upload(path, file);
  
  if (upErr) {
    alert("Upload failed: " + upErr.message);
    button.innerHTML = originalText;
    button.disabled = false;
    return;
  }
  
  const { data: urlData } = supabase.storage.from("submissions").getPublicUrl(path);
  const fileUrl = urlData.publicUrl;

  // Fetch client_id from hire
  const { data: hire } = await supabase.from("hires").select("client_id").eq("id", hireId).single();

  // Insert preview submission row
  const { error } = await supabase.from("preview_submissions").insert({
    hire_id: hireId,
    freelancer_id: user.id,
    client_id: hire.client_id,
    file_url: fileUrl,
    status: "submitted"
  });

  if (error) {
    console.error(error);
    alert("Failed to submit preview");
    button.innerHTML = originalText;
    button.disabled = false;
    return;
  }

  // Notify client
  await supabase.from("notifications").insert({
    user_id: hire.client_id,
    type: "preview",
    message: `Freelancer submitted a preview for hire ${hireId}.`
  });

  // Show success and reload
  button.innerHTML = '✅ Submitted!';
  setTimeout(() => {
    window.location.reload();
  }, 1500);
}
