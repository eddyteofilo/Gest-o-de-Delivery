import { MercadoPagoConfig, Payment, Preference } from 'mercadopago';

export const createPayment = async (
  token: string, 
  amount: number, 
  description: string, 
  payerEmail: string, 
  orderId: string,
  method: 'pix' | 'credit_card' = 'pix',
  cardToken?: string
) => {
  const client = new MercadoPagoConfig({ accessToken: token });
  const payment = new Payment(client);

  const requestOptions = {
    idempotencyKey: `pay_${orderId}_${Date.now()}`
  };

  const body: any = {
    transaction_amount: Number(amount.toFixed(2)),
    description: description,
    payment_method_id: method,
    payer: {
      email: payerEmail || 'cliente@mercadopago.com',
    },
    external_reference: orderId,
  };

  if (method === 'credit_card' && cardToken) {
    body.token = cardToken;
    body.installments = 1;
  }

  try {
    const res = await payment.create({ body, requestOptions });
    return {
      id: res.id,
      status: res.status,
      detail: res.status_detail,
      qr_code: res.point_of_interaction?.transaction_data?.qr_code,
      qr_code_base64: res.point_of_interaction?.transaction_data?.qr_code_base64,
    };
  } catch (error: any) {
    console.error("Erro MP:", error.message);
    throw new Error(`Erro no Mercado Pago: ${error.message}`);
  }
};

export const createCheckoutPreference = async (
  token: string,
  amount: number,
  description: string,
  orderId: string
) => {
  const client = new MercadoPagoConfig({ accessToken: token });
  const preference = new Preference(client);

  const body = {
    items: [
      {
        id: orderId,
        title: description,
        unit_price: Number(amount.toFixed(2)),
        quantity: 1,
        currency_id: 'BRL'
      }
    ],
    external_reference: orderId,
    back_urls: {
      success: 'https://delivery-beta.vercel.app/tracking',
      failure: 'https://delivery-beta.vercel.app/tracking',
      pending: 'https://delivery-beta.vercel.app/tracking',
    },
    auto_return: 'approved' as const,
  };

  try {
    const res = await preference.create({ body });
    return {
      id: res.id,
      init_point: res.init_point,
    };
  } catch (error: any) {
    console.error("Erro MP Preference:", error.message);
    throw new Error(`Erro ao criar preferência de checkout: ${error.message}`);
  }
};

