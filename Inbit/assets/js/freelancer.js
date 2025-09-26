import { supabase } from "../../supabase/config.js";

const availabilityBtn = document.getElementById("toggleAvailability");
const statusText = document.getElementById("availabilityStatus");
const portfolioForm = document.getElementById("portfolioForm");
const portfolioList = document.getElementById("portfolioList");
const matchedJobsDiv = document.getElementById("matchedJobs");

// Get logged-in freelancer
async function getFreelancer() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    alert("Not logged in.");
    window.location.href = "login.html";
    return null;
  }
  return user;
}

// Load availability
async function loadAvailability() {
  const freelancer = await getFreelancer();
  if (!freelancer) return;

  const { data, error } = await supabase
    .from("users")
    .select("available")
    .eq("id", freelancer.id)
    .single();

  if (error) return;

  statusText.textContent = data.available ? "✅ Available" : "❌ Not Available";
  availabilityBtn.textContent = data.available ? "Set Unavailable" : "Set Available";
}

// Toggle availability
// Toggle availability (freelancer side)
async function toggleAvailability() {
  const freelancer = await getFreelancer(); // your existing helper
  if (!freelancer) return;

  // fetch current available state
  const { data, error } = await supabase
    .from("users")
    .select("available")
    .eq("id", freelancer.id)
    .single();
  if (error) { console.error(error); return; }

  const newStatus = !data.available;

  // If turning ON, check unpaid fees
  if (newStatus === true) {
    const { data: unpaid, error: feeErr } = await supabase
      .from("platform_fees")
      .select("id, contract_id, fee_amount, status")
      .eq("freelancer_id", freelancer.id)
      .neq("status", "paid"); // any status that's not paid (unpaid/pending_verification/rejected)
    if (feeErr) { console.error(feeErr); }
    if (unpaid && unpaid.length > 0) {
      // Option: show details and send them to the fees page
      const totalDue = unpaid.reduce((s, f) => s + Number(f.fee_amount || 0), 0).toFixed(2);
      alert(`You have outstanding platform fees totaling ${totalDue}. Pay them to become available again.`);
      // redirect to freelancer fees page
      window.location.href = "/freelancer/fees.html";
      return;
    }
  }

  // No unpaid fees or toggling off → proceed
  const { error: updErr } = await supabase
    .from("users")
    .update({ available: newStatus })
    .eq("id", freelancer.id);

  if (updErr) {
    console.error("Failed to update availability:", updErr);
    alert("Failed to change availability.");
    return;
  }
  loadAvailability();
}


// Upload portfolio
async function handlePortfolioUpload(event) {
  event.preventDefault();
  const freelancer = await getFreelancer();
  if (!freelancer) return;

  const formData = new FormData(event.target);
  const file = formData.get("file");

  // Upload file to storage
  const filePath = `${freelancer.id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("portfolio")
    .upload(filePath, file);

  if (uploadError) {
    alert("File upload failed: " + uploadError.message);
    return;
  }

  // Insert into DB
  const { error } = await supabase.from("freelancer_portfolio").insert({
    freelancer_id: freelancer.id,
    title: formData.get("title"),
    description: formData.get("description"),
    file_url: filePath
  });

  if (error) {
    alert("DB insert failed: " + error.message);
    return;
  }

  alert("Portfolio uploaded!");
  loadPortfolio();
}

// Load portfolio
async function loadPortfolio() {
  const freelancer = await getFreelancer();
  if (!freelancer) return;

  const { data, error } = await supabase
    .from("freelancer_portfolio")
    .select("*")
    .eq("freelancer_id", freelancer.id);

  if (error) return;

  portfolioList.innerHTML = "";
  data.forEach(item => {
    portfolioList.innerHTML += `
      <div class="card">
        <p><b>${item.title}</b></p>
        <p>${item.description || ""}</p>
        <a href="${supabase.storage.from("portfolio").getPublicUrl(item.file_url).data.publicUrl}" target="_blank">View</a>
      </div>
    `;
  });
}

// Placeholder for matched jobs (later will plug AI matching)
/**
 * MATCHED JOBS
 */
async function loadMatchedJobs() {
  const freelancer = await getFreelancer();
  if (!freelancer) return;

  const container = document.getElementById("matchedJobs");
  if (!container) return;

  // Show loading state
  container.innerHTML = '<div class="loading">Loading matched jobs...</div>';

  const { data, error } = await supabase
    .from("job_matches")
    .select(`
      id,
      score,
      jobs(id, title, description, created_at),
      clients:jobs!inner(client_id, users(full_name))
    `)
    .eq("freelancer_id", freelancer.id)
    .order("score", { ascending: false });

  if (error) {
    container.innerHTML = '<p class="error">Error loading matched jobs.</p>';
    console.error(error);
    return;
  }

  container.innerHTML = '<div class="jobs-grid"></div>';
  const jobsGrid = container.querySelector('.jobs-grid');

  if (!data || data.length === 0) {
    jobsGrid.innerHTML = `
      <div class="empty-jobs">
        <h3>No Job Matches Yet</h3>
        <p>We're working to find the perfect jobs for your skills!</p>
        <p>Complete your profile and portfolio to get better matches.</p>
      </div>
    `;
    return;
  }

  data.forEach((match, index) => {
    const job = match.jobs;
    const jobCard = document.createElement("div");
    jobCard.className = "job-card";
    jobCard.style.animationDelay = `${index * 0.1}s`;

    jobCard.innerHTML = `
      <div class="job-header">
        <h3 class="job-title">${job.title}</h3>
        <span class="match-badge">${Math.round(match.score)}% Match</span>
      </div>
      
      <div class="job-description">
        ${job.description}
      </div>
      
      <div class="job-meta">
        <div class="meta-item">
          <span class="meta-label">Posted</span>
          <span class="meta-value">${new Date(job.created_at).toLocaleDateString()}</span>
        </div>
        ${match.clients?.users ? `
          <div class="meta-item">
            <span class="meta-label">Client</span>
            <span class="meta-value">${match.clients.users.full_name}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="job-status">
        <span class="status-icon">✅</span>
        <div>
          <div class="status-text">You've Been Matched!</div>
          <div class="status-note">Awaiting client hire decision</div>
        </div>
      </div>
    `;

    jobsGrid.appendChild(jobCard);
  });
}

// Init
document.addEventListener("DOMContentLoaded", () => {
  loadAvailability();
  loadPortfolio();
  loadMatchedJobs();

  if (availabilityBtn) availabilityBtn.addEventListener("click", toggleAvailability);
  if (portfolioForm) portfolioForm.addEventListener("submit", handlePortfolioUpload);
});


async function loadHires() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    document.getElementById("hiresList").innerHTML = "<p>You must be logged in.</p>";
    return;
  }

  const { data, error: hiresError } = await supabase
    .from("hires")
    .select(`
      id,
      created_at,
      jobs(id, title, description),
      users!hires_client_id_fkey(full_name)  -- client who hired
    `)
    .eq("freelancer_id", user.id);

  const hiresList = document.getElementById("hiresList");

  if (hiresError) {
    hiresList.innerHTML = "<p>Error loading hires.</p>";
    console.error(hiresError);
    return;
  }

  if (!data || data.length === 0) {
    hiresList.innerHTML = "<p>No jobs yet.</p>";
    return;
  }

  hiresList.innerHTML = "";
  data.forEach(hire => {
    hiresList.innerHTML += `
      <div class="card">
        <h3>${hire.jobs.title}</h3>
        <p>${hire.jobs.description}</p>
        <p><b>Client:</b> ${hire.users.full_name}</p>
        <small>Hired on ${new Date(hire.created_at).toLocaleString()}</small>
        <button onclick="window.location.href='../chat/chat.html?hire=${hire.id}'">
      Chat
    </button>
      </div>
    `;
  });
}

// Attach on page load
document.addEventListener("DOMContentLoaded", loadHires);


async function loadNotifications() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = document.getElementById("notificationsList");
  if (error || !data || data.length === 0) {
    list.innerHTML = "<li>No notifications</li>";
    return;
  }

  list.innerHTML = "";
  data.forEach(n => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${n.message}
      <button class="dismiss-btn" data-id="${n.id}">Dismiss</button>
    `;
    list.appendChild(li);
  });

  // Attach event listeners to dismiss buttons
  document.querySelectorAll(".dismiss-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      await deleteNotification(id);
      e.target.parentElement.remove();
    });
  });
}


// Real-time subscription
function subscribeToNotifications(userId) {
  supabase
    .channel("notifications-" + userId)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      payload => {
        const list = document.getElementById("notificationsList");
        const n = payload.new;

        const li = document.createElement("li");
        li.innerHTML = `
          ${n.message}
          <button class="dismiss-btn" data-id="${n.id}">Dismiss</button>
        `;

        li.querySelector(".dismiss-btn").addEventListener("click", async (e) => {
          await deleteNotification(n.id);
          e.target.parentElement.remove();
        });

        list.prepend(li);
      }
    )
    .subscribe();
}


async function deleteNotification(id) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete notification:", error.message);
  }
}


// Init
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    loadNotifications();
    subscribeToNotifications(user.id);
  }
});


// FREELANCER: mark received
export async function markReceived(contractId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");

  const { error } = await supabase.from('contracts').update({
    freelancer_marked_received: true,
    status: 'payment_sent'  // still payment_sent until admin confirms release
  }).eq('id', contractId);

  if (error) throw error;

  // notify admin
  // (Assuming admin user(s) have role='admin' in users)
  const { data: admins } = await supabase.from('users').select('id').eq('role','admin');
  for (const a of admins || []) {
    await supabase.from('notifications').insert({
      user_id: a.id,
      type: 'payment',
      message: `Freelancer marked payment received for contract ${contractId}`
    });
  }
  return true;
}

async function loadContractForFreelancer() {
  const params = new URLSearchParams(window.location.search);
  const contractId = params.get('contract');
  if (!contractId) return;

  // get contract and show client-chosen payment_method
  const { data: contract, error } = await supabase
    .from('contracts')
    .select('id, payment_method, client_id, total_amount, freelancer_id')
    .eq('id', contractId)
    .single();
  if (error) {
    console.error(error);
    return;
  }

  document.getElementById('contractPaymentMethod').value = contract.payment_method;

  // show appropriate fields
  if (contract.payment_method === 'bank_transfer') {
    document.getElementById('bankFields').style.display = 'block';
  } else if (contract.payment_method === 'crypto') {
    document.getElementById('cryptoFields').style.display = 'block';
  }

  // attach submit listener
  const form = document.getElementById('paymentDetailsForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await submitPaymentDetails(contractId);
  });
}

async function submitPaymentDetails(contractId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Login required');
    return;
  }

  // fetch contract to confirm freelancer is owner
  const { data: c, error: cErr } = await supabase.from('contracts').select('freelancer_id, payment_method').eq('id', contractId).single();
  if (cErr) { console.error(cErr); alert('Contract load error'); return; }
  if (c.freelancer_id !== user.id) { alert('Not authorized for this contract'); return; }

  const paymentMethod = c.payment_method;
  let details = {};

  if (paymentMethod === 'bank_transfer') {
    details.bank_name = document.querySelector('input[name="bank_name"]').value.trim();
    details.account_name = document.querySelector('input[name="account_name"]').value.trim();
    details.account_number = document.querySelector('input[name="account_number"]').value.trim();
    details.swift = document.querySelector('input[name="swift"]').value.trim();
  } else if (paymentMethod === 'crypto') {
    details.crypto_network = document.querySelector('input[name="crypto_network"]').value.trim();
    details.address = document.querySelector('input[name="address"]').value.trim();
  } else {
    // other method — collect freeform data
    details.note = 'See contact for details';
  }

  // optional proof upload
  const proofFile = document.getElementById('paymentProofFile').files[0];
  let proofUrl = null;
  if (proofFile) {
    const path = `contract-proofs/${contractId}/${Date.now()}-${proofFile.name}`;
    const { error: upErr } = await supabase.storage.from('proofs').upload(path, proofFile);
    if (upErr) { console.error(upErr); alert('Upload failed'); return; }
    const { data: urlData } = supabase.storage.from('proofs').getPublicUrl(path);
    proofUrl = urlData.publicUrl;
  }

  const { data, error } = await supabase.from('contract_payment_details').insert([{
    contract_id: contractId,
    freelancer_id: user.id,
    payment_method: paymentMethod,
    details: details,
    proof_url: proofUrl
  }]).select('id').single();

  if (error) {
    console.error(error);
    alert('Failed to save details');
    return;
  }

  // notify client & admin
  // fetch client id from contracts
  const { data: contract } = await supabase.from('contracts').select('client_id').eq('id', contractId).single();
  if (contract?.client_id) {
    await supabase.from('notifications').insert({
      user_id: contract.client_id,
      type: 'info',
      message: `Freelancer has provided payment receiving details for contract ${contractId}.`
    });
  }
  // notify admin(s)
  const { data: admins } = await supabase.from('users').select('id').eq('role', 'admin');
  for (const a of admins || []) {
    await supabase.from('notifications').insert({
      user_id: a.id,
      type: 'info',
      message: `Freelancer provided payment details for contract ${contractId}. Please verify.`
    });
  }

  alert('Payment details submitted. Please wait while client reviews or admin verifies.');
  // optional: redirect freelancer to contract view
  window.location.reload();
}

document.addEventListener('DOMContentLoaded', loadContractForFreelancer);
