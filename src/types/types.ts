export interface JobItem {
  title: string;
  description: string;
  budget: string;
  period: string;
  client: string;
  applicants: number;
  link: string;
  // Detailed information
  detailDescription?: string;
  applicantsCount?: number;
  contractedCount?: number;
  requiredCount?: number;
  applicationDeadline?: string;
  clientName?: string;
  clientRating?: number;
  clientReviewCount?: number;
  clientIdentityVerified?: boolean;
  clientRuleCheckSucceeded?: boolean;
  additionalData?: string; // Added for getByRole('cell', { name: '-' })
  error?: string; // Optional error property added
}
