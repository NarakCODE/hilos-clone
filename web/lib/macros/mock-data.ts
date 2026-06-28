import type { Macro } from "./types"

export const mockMacros: Macro[] = [
  {
    id: "mac-1",
    name: "Reset Password Instructions",
    description: "Provide steps to reset account passwords securely.",
    content: "Hi {{customer.name}},\n\nYou can reset your password by going to the login screen and clicking 'Forgot Password'. Alternatively, you can use this secure link directly: https://efferd.com/reset-password?token={{reset.token}}.\n\nLet us know if you run into any issues!\n\nBest,\n{{agent.name}}",
    category: "general",
    usageCount: 142,
  },
  {
    id: "mac-2",
    name: "Salesforce Re-auth Guide",
    description: "Steps to authorize Salesforce connection with standard scopes.",
    content: "Hi {{customer.name}},\n\nTo re-authorize your Salesforce connection, please verify that your admin user has the 'API Enabled' permission set active inside Salesforce. Once checked:\n1. Log into Gray UI.\n2. Navigate to Settings > Integrations.\n3. Click 'Reconnect Salesforce' and authorize using your Salesforce admin credentials.\n\nLet me know if the authorization succeeds!\n\nBest,\n{{agent.name}}",
    category: "technical",
    usageCount: 88,
  },
  {
    id: "mac-3",
    name: "Refund Policy Response",
    description: "Standard response detailing refund eligibility guidelines.",
    content: "Hi {{customer.name}},\n\nThanks for reaching out! According to our refund policy, licenses cancelled within the first 14 days of subscription are eligible for a full refund. I have initiated a refund of {{billing.amount}} to your card on file. The credits should reflect in 3-5 business days.\n\nLet us know if there is anything else we can do.\n\nBest,\n{{agent.name}}",
    category: "billing",
    usageCount: 54,
  },
]
