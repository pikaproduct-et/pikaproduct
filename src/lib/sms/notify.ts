/** Placeholder for outbound SMS (reservation notifications, webhook
 * confirmations). Wire this up to your gateway's send-message API once
 * you have provider credentials — intentionally not implemented here
 * since it needs a live account. Shared by the SMS webhook (Phase 1)
 * and the reservation flow (Phase 5) so there's one place to swap in a
 * real provider later. */
export async function sendSms(to: string, message: string) {
  console.log(`[sms stub] to=${to} message=${message}`);
}
