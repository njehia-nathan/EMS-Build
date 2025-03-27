// lib/paystack.ts
import axios from "axios";

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY as string;
const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string;

interface InitiatePaymentArgs {
  email: string;
  amount: number; // amount in kobo (smallest currency unit)
  reference?: string;
  metadata?: Record<string, any>;
  callback_url?: string;
}

interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface InitiatePaymentResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface VerifyPaymentResponse {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  authorization: {
    authorization_code: string;
    bin: string;
    last4: string;
    exp_month: string;
    exp_year: string;
    card_type: string;
    bank: string;
    brand: string;
  };
  customer: {
    id: number;
    email: string;
    name: string;
  };
  metadata: Record<string, any>;
}

interface InitiateRefundArgs {
  transaction: string;
  amount?: number;
  merchant_note: string;
}

interface InitiateRefundResponse {
  id: number;
  transaction: string;
  amount: number;
  currency: string;
  status: string;
  merchant_note: string;
  processed_at: string;
}

class PaystackService {
  private axiosInstance = axios.create({
    baseURL: "https://api.paystack.co",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  // Create a payment link
  async initiatePayment(args: InitiatePaymentArgs): Promise<PaystackResponse<InitiatePaymentResponse>> {
    try {
      const response = await this.axiosInstance.post("/transaction/initialize", {
        ...args,
        amount: args.amount * 100, // Convert to kobo (smallest currency unit)
      });
      return response.data;
    } catch (error) {
      console.error("Paystack initiate payment error:", error);
      throw error;
    }
  }

  // Verify payment status
  async verifyPayment(reference: string): Promise<PaystackResponse<VerifyPaymentResponse>> {
    try {
      const response = await this.axiosInstance.get(`/transaction/verify/${reference}`);
      return response.data;
    } catch (error) {
      console.error("Paystack verify payment error:", error);
      throw error;
    }
  }

  // Process refund
  async initiateRefund(args: InitiateRefundArgs): Promise<PaystackResponse<InitiateRefundResponse>> {
    try {
      const response = await this.axiosInstance.post("/refund", args);
      return response.data;
    } catch (error) {
      console.error("Paystack initiate refund error:", error);
      throw error;
    }
  }

  // Get public key for frontend
  getPublicKey(): string {
    return PAYSTACK_PUBLIC_KEY;
  }
}

export const paystackService = new PaystackService();