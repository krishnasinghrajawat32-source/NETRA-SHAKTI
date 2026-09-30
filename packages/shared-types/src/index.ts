// NETRA SHAKTI - Core Shared Types & Enums

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SENDER = 'SENDER',
  RECIPIENT = 'RECIPIENT',
  INVESTIGATOR = 'INVESTIGATOR'
}

export enum ClearanceLevel {
  UNCLASSIFIED = 'UNCLASSIFIED',
  RESTRICTED = 'RESTRICTED',
  CONFIDENTIAL = 'CONFIDENTIAL',
  SECRET = 'SECRET',
  TOP_SECRET = 'TOP_SECRET'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  PASSWORD_CHANGE_REQUIRED = 'PASSWORD_CHANGE_REQUIRED'
}

export enum DocumentClassification {
  UNCLASSIFIED = 'UNCLASSIFIED',
  CONFIDENTIAL = 'CONFIDENTIAL',
  SECRET = 'SECRET',
  TOP_SECRET = 'TOP_SECRET'
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  ENCRYPTED = 'ENCRYPTED',
  DISTRIBUTED = 'DISTRIBUTED',
  REVOKED = 'REVOKED',
  ARCHIVED = 'ARCHIVED'
}

export enum RecipientAccessStatus {
  GRANTED = 'GRANTED',
  ACCESSED = 'ACCESSED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED'
}

export enum DecryptionSessionStatus {
  CREATED = 'CREATED',
  AUTHORIZING = 'AUTHORIZING',
  DECRYPTING = 'DECRYPTING',
  WATERMARKING = 'WATERMARKING',
  SIGNING = 'SIGNING',
  LEDGER_COMMIT = 'LEDGER_COMMIT',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum InvestigationStatus {
  OPEN = 'OPEN',
  PROCESSING = 'PROCESSING',
  ANALYSIS_COMPLETED = 'ANALYSIS_COMPLETED',
  CLOSED = 'CLOSED'
}

export enum InvestigationFindingMatch {
  VERIFIED_MATCH = 'VERIFIED_MATCH',
  PARTIAL_MATCH = 'PARTIAL_MATCH',
  NO_MATCH = 'NO_MATCH',
  INVALID_WATERMARK = 'INVALID_WATERMARK',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  LEDGER_MISMATCH = 'LEDGER_MISMATCH',
  LOW_CONFIDENCE = 'LOW_CONFIDENCE',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED'
}

export enum TransformationType {
  ORIGINAL = 'ORIGINAL',
  SCREENSHOT = 'SCREENSHOT',
  COMPRESSED = 'COMPRESSED',
  RESIZED = 'RESIZED',
  CROPPED = 'CROPPED',
  ROTATED = 'ROTATED',
  CAMERA_CAPTURE = 'CAMERA_CAPTURE',
  RE_EXPORTED = 'RE_EXPORTED',
  UNKNOWN = 'UNKNOWN'
}

export enum AuditEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_ENCRYPTED = 'DOCUMENT_ENCRYPTED',
  RECIPIENT_ASSIGNED = 'RECIPIENT_ASSIGNED',
  RECIPIENT_REVOKED = 'RECIPIENT_REVOKED',
  DECRYPTION_STARTED = 'DECRYPTION_STARTED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  DECRYPTION_COMPLETED = 'DECRYPTION_COMPLETED',
  WATERMARK_CREATED = 'WATERMARK_CREATED',
  SIGNATURE_CREATED = 'SIGNATURE_CREATED',
  LEDGER_EVENT_APPENDED = 'LEDGER_EVENT_APPENDED',
  INVESTIGATION_CREATED = 'INVESTIGATION_CREATED',
  INVESTIGATION_ANALYZED = 'INVESTIGATION_ANALYZED',
  REPORT_EXPORTED = 'REPORT_EXPORTED',
  KEY_ROTATED = 'KEY_ROTATED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  SYSTEM_CONFIG_UPDATED = 'SYSTEM_CONFIG_UPDATED'
}

export enum MLModelStatus {
  ACTIVE = 'ACTIVE',
  TRAINING = 'TRAINING',
  DEPRECATED = 'DEPRECATED',
  OFFLINE = 'OFFLINE'
}

// User & Auth Interfaces
export interface IUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  department: string;
  rank?: string | null;
  unit?: string | null;
  clearanceLevel: ClearanceLevel;
  status: UserStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ICryptoIdentity {
  id: string;
  userId: string;
  encryptionPublicKey: string;
  signingPublicKey: string;
  algorithm: string;
  keyVersion: number;
  status: string;
  createdAt: Date | string;
  revokedAt?: Date | string | null;
}

export interface IDocumentPolicy {
  id: string;
  allowDownload: boolean;
  allowPrint: boolean;
  secureViewerOnly: boolean;
  expiryDate?: Date | string | null;
  watermarkRequired: boolean;
  signatureRequired: boolean;
  maxAccessCount?: number | null;
}

export interface IDocument {
  id: string;
  documentCode: string;
  title: string;
  description?: string | null;
  originalFilename: string;
  mimeType: string;
  size: number;
  pageCount: number;
  classification: DocumentClassification;
  ownerId: string;
  owner?: IUser;
  encryptedObjectKey: string;
  originalHash: string;
  encryptedHash: string;
  status: DocumentStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  policies?: IDocumentPolicy;
  recipients?: IDocumentRecipient[];
}

export interface IDocumentRecipient {
  id: string;
  documentId: string;
  document?: IDocument;
  recipientId: string;
  recipient?: IUser;
  assignedById: string;
  assignedBy?: IUser;
  assignedAt: Date | string;
  expiresAt?: Date | string | null;
  status: RecipientAccessStatus;
  policyId?: string | null;
  policy?: IDocumentPolicy | null;
  accessCount?: number;
}

export interface IDecryptionSession {
  id: string;
  sessionCode: string;
  documentId: string;
  document?: IDocument;
  recipientId: string;
  recipient?: IUser;
  status: DecryptionSessionStatus;
  startedAt: Date | string;
  completedAt?: Date | string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceFingerprint?: string | null;
  sessionNonce: string;
  issuedObjectKey?: string | null;
  issuedDocumentHash?: string | null;
  watermarkId?: string | null;
  signatureId?: string | null;
  ledgerEventId?: string | null;
  watermark?: IWatermark | null;
  signature?: IDigitalSignature | null;
  ledgerEvent?: ILedgerEvent | null;
  errorMessage?: string | null;
}

export interface IWatermark {
  id: string;
  watermarkCode: string;
  documentId: string;
  document?: IDocument | null;
  recipientId: string;
  sessionId: string;
  session?: IDecryptionSession | null;
  payloadHash: string;
  algorithm: string;
  version: string;
  createdAt: Date | string;
  status: string;
}

export interface IDigitalSignature {
  id: string;
  sessionId: string;
  signerId: string;
  algorithm: string;
  payloadHash: string;
  signature: string;
  keyVersion: number;
  verificationStatus: string;
  createdAt: Date | string;
}

export interface ILedgerEvent {
  id: string;
  sequenceNumber: number;
  eventType: string;
  entityType: string;
  entityId: string;
  payloadHash: string;
  previousHash: string;
  eventHash: string;
  signature: string;
  actorId: string;
  createdAt: Date | string;
}

export interface IInvestigation {
  id: string;
  caseNumber: string;
  title: string;
  description?: string | null;
  createdById: string;
  createdBy?: IUser;
  status: InvestigationStatus;
  createdAt: Date | string;
  completedAt?: Date | string | null;
  evidence?: IInvestigationEvidence[];
  findings?: IInvestigationFinding[];
}

export interface IInvestigationEvidence {
  id: string;
  investigationId: string;
  originalFilename: string;
  storageObjectKey: string;
  contentHash: string;
  mimeType: string;
  size: number;
  createdAt: Date | string;
}

export interface IInvestigationFinding {
  id: string;
  investigationId: string;
  watermarkId?: string | null;
  documentId?: string | null;
  document?: IDocument | null;
  sessionId?: string | null;
  session?: IDecryptionSession | null;
  recipientId?: string | null;
  recipient?: IUser | null;
  matchType: InvestigationFindingMatch;
  confidence: number;
  signatureValid: boolean;
  ledgerValid: boolean;
  cryptographicWatermarkValid: boolean;
  transformationType?: TransformationType | null;
  tamperScore?: number | null;
  similarityScore?: number | null;
  forensicNotes?: string | null;
  createdAt: Date | string;
}

export interface IMLModel {
  id: string;
  name: string;
  version: string;
  task: string;
  framework: string;
  artifactPath: string;
  datasetVersion: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  watermarkRecoveryRate: number;
  status: MLModelStatus;
  createdAt: Date | string;
}

export interface IMLInference {
  id: string;
  modelId: string;
  evidenceId: string;
  task: string;
  inputHash: string;
  outputPayload: Record<string, any>;
  confidence: number;
  latencyMs: number;
  createdAt: Date | string;
}

export interface IAuditEvent {
  id: string;
  eventType: AuditEventType;
  userId?: string | null;
  user?: IUser | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  action: string;
  details?: Record<string, any> | null;
  status: 'SUCCESS' | 'FAILURE' | 'WARNING';
  createdAt: Date | string;
}

export interface ISystemHealth {
  status: 'OPERATIONAL' | 'DEGRADED' | 'FAILED' | 'UNKNOWN';
  timestamp: string;
  services: {
    database: { status: 'UP' | 'DOWN'; latencyMs?: number; details?: string };
    redis: { status: 'UP' | 'DOWN'; latencyMs?: number; details?: string };
    storage: { status: 'UP' | 'DOWN'; latencyMs?: number; details?: string };
    cryptoProvider: { status: 'UP' | 'DOWN'; algorithm: string; pqcReady: boolean };
    watermarkEngine: { status: 'UP' | 'DOWN'; algorithm: string; version: string };
    ledgerEngine: { status: 'UP' | 'DOWN'; type: string; currentSequence: number };
    mlService: { status: 'UP' | 'DOWN' | 'OFFLINE'; activeModel?: string; latencyMs?: number };
  };
}

export interface IDashboardStats {
  protectedDocuments: number;
  activeRecipients: number;
  completedSessions: number;
  openInvestigations: number;
  verifiedAttributionCases: number;
  failedSecurityOperations: number;
  mlServiceStatus: string;
  ledgerStatus: string;
  recentActivity: IAuditEvent[];
  classificationDistribution: { classification: string; count: number }[];
  sessionTimeline: { date: string; count: number }[];
}

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  requestId?: string;
  timestamp: string;
}

export interface IProvenanceRecord {
  version: string;
  documentId: string;
  documentHash: string;
  recipientId: string;
  sessionId: string;
  watermarkHash: string;
  keyVersion: number;
  timestamp: number;
  eventNonce: string;
}

export const BRAND = {
  name: 'NETRA SHAKTI',
  tagline: 'TRACE THE ORIGIN, PROVE THE TRUTH',
  description: 'Cryptographic Attribution and Immutable Decryption Provenance System',
  subTitle: 'Cryptographic Attribution and Immutable Decryption Provenance System',
  domainTitle: 'DEFENCE-Grade Document Security',
  platformName: 'DEFENCE Cybersecurity Platform',
  disclaimer: 'The recovered forensic fingerprint is associated with the recorded decryption session assigned to this recipient. Document attribution identifies the issued source copy and does not independently establish user intent or responsibility for disclosure.',
  shortDisclaimer: 'Attribution identifies the issued source copy and does not independently establish intent or responsibility for disclosure.'
} as const;

export type BrandConfig = typeof BRAND;
