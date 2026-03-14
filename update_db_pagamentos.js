async function addPaymentColumns() {
  const token = 'sbp_6c44191db15748727eb96c68bbf8d776b766e4ae';
  const ref = 'uzcebsgsqhdxwagmrvrn';
  const query = `
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100);
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_qr_code TEXT;
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_qr_code_base64 TEXT;
  `;

  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query })
    });

    if(!res.ok) {
       console.error(await res.text());
    } else {
       console.log("Success:", await res.json());
    }
  } catch (e) {
    console.error(e);
  }
}

addPaymentColumns();
