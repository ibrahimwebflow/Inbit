import { supabase } from "../../../supabase/config.js";

document.addEventListener("DOMContentLoaded", loadPaymentDetails);
document.getElementById("paymentForm").addEventListener("submit", savePaymentDetails);

async function loadPaymentDetails() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    document.getElementById("currentDetails").innerHTML =
      "<p>You must be logged in as a freelancer.</p>";
    return;
  }

  const { data, error } = await supabase
    .from("payment_details")
    .select("*")
    .eq("freelancer_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error(error);
    return;
  }

  if (data) {
    document.getElementById("currentDetails").innerHTML = `
      <h3>Your Current Payment Details</h3>
      <p><b>Bank:</b> ${data.bank_name}</p>
      <p><b>Account Number:</b> ${data.account_number}</p>
      <p><b>Account Name:</b> ${data.account_name}</p>
    `;
  }
}

async function savePaymentDetails(e) {
  e.preventDefault();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const bank_name = document.getElementById("bankName").value;
  const account_number = document.getElementById("accountNumber").value;
  const account_name = document.getElementById("accountName").value;

  // Upsert ensures one row per freelancer
  const { error } = await supabase.from("payment_details").upsert(
    {
      freelancer_id: user.id,
      bank_name,
      account_number,
      account_name,
    },
    { onConflict: "freelancer_id" }
  );

  if (error) {
    console.error(error);
    alert("Failed to save payment details.");
    return;
  }

  alert("Payment details saved successfully!");
  loadPaymentDetails();
}
