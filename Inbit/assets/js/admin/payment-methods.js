import { supabase } from "../../../supabase/config.js";

document.addEventListener("DOMContentLoaded", () => {
  loadMethods();

  document.getElementById("methodForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const type = document.getElementById("type").value;
    const label = document.getElementById("label").value;
    let details;
    
    try {
      details = JSON.parse(document.getElementById("details").value);
    } catch {
      alert("Details must be valid JSON.");
      return;
    }
    
    const instructions = document.getElementById("instructions").value;
    const proof_img = document.getElementById("proof_img").value;

    const { error } = await supabase.from("admin_payment_methods").insert([{
      type,
      label,
      details,
      instructions,
      proof_img,
    }]);

    if (error) {
      console.error(error);
      alert("Error saving payment method");
    } else {
      alert("Payment method saved successfully!");
      e.target.reset();
      document.getElementById('details').classList.remove('json-valid');
      loadMethods();
    }
  });
});

async function loadMethods() {
  const container = document.getElementById("methodsList");
  container.innerHTML = '<div class="loading">Loading payment methods...</div>';

  const { data, error } = await supabase
    .from("admin_payment_methods")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    container.innerHTML = '<p class="error">Error loading payment methods.</p>';
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = '<p class="empty-state">No payment methods configured yet.</p>';
    return;
  }

  container.innerHTML = "";
  
  data.forEach((m) => {
    const div = document.createElement("div");
    div.className = "method-card";
    
    div.innerHTML = `
      <h3>
        ${m.label} 
        <span class="method-type">${m.type}</span>
      </h3>
      
      <pre>${JSON.stringify(m.details, null, 2)}</pre>
      
      ${m.instructions ? `<p><strong>Instructions:</strong> ${m.instructions}</p>` : ''}
      
      ${m.proof_img ? `
        <div>
          <strong>Reference Image:</strong>
          <img src="${m.proof_img}" alt="${m.label} reference" />
        </div>
      ` : ''}
      
      <div class="status-badge ${m.active ? 'status-active' : 'status-inactive'}">
        ${m.active ? 'Active ✅' : 'Inactive ❌'}
      </div>
      
      <div class="action-buttons">
        <button class="toggle-btn" data-id="${m.id}" data-active="${m.active}">
          ${m.active ? '⏸️ Deactivate' : '▶️ Activate'}
        </button>
        <button class="delete-btn" data-id="${m.id}">🗑️ Delete</button>
      </div>
    `;
    
    container.appendChild(div);
  });

  // Activate/deactivate buttons
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      const active = e.target.dataset.active === "true";
      
      const { error } = await supabase
        .from("admin_payment_methods")
        .update({ active: !active })
        .eq("id", id);
        
      if (error) {
        alert("Failed to update payment method status");
      } else {
        loadMethods();
      }
    });
  });

  // Delete buttons
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      
      if (!confirm("Are you sure you want to delete this payment method?")) return;
      
      const { error } = await supabase
        .from("admin_payment_methods")
        .delete()
        .eq("id", id);
        
      if (error) {
        alert("Failed to delete payment method");
      } else {
        loadMethods();
      }
    });
  });
      }
