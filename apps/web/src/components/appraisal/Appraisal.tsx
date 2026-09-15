"use client";

import type {
  Dispatch,
  ReactElement,
  SetStateAction,
} from "react";

import type { UploadedAppraisal } from "@/types/appraisal";
import type {
  Department,
  DocumentType,
} from "@/types/departments";
import type {
  AdditionalMetadataField,
  MetadataRecord,
} from "@/types/metadata";

type AppraisalMetadataForm = {
  referenceCode: string;
  title: string;
  documentDate: string;
  year: string;
  personName: string;
  departmentId: string;
  documentTypeId: string;
  section: string;
  description: string;
};

type AppraisalProps = {
  canManageDocuments: boolean;

  departments: Department[];
  documentTypes: DocumentType[];

  uploadedAppraisal: UploadedAppraisal;

  appraisalMetadataForm: AppraisalMetadataForm;

  appraisalAdditionalMetadata:
    AdditionalMetadataField[];

  appraisalCommittedAdditionalMetadata:
    AdditionalMetadataField[];

  appraisalRequiredFieldsComplete: boolean;

  appraisalDecisionLabel: string;

  appraisalIsLinked: boolean;

  matchedMetadata:
    MetadataRecord | null;

  reviewingDecision: boolean;

  reviewError: string;

  setAppraisalMetadataForm: Dispatch<
    SetStateAction<AppraisalMetadataForm>
  >;

  setAppraisalAdditionalMetadata: Dispatch<
    SetStateAction<AdditionalMetadataField[]>
  >;

  setAppraisalCommittedAdditionalMetadata:
    Dispatch<
      SetStateAction<AdditionalMetadataField[]>
    >;

  handleAppraisalReview: (
    decision: "APPROVE" | "REJECT"
  ) => Promise<void>;

  FormField: (props: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
  }) => ReactElement;

  StatusBadge: (props: {
    status: string;
  }) => ReactElement;

  formatFileSize: (
    bytes: number | null | undefined
  ) => string;

  formatUploadFieldLabel: (
    key: string
  ) => string;

  formatUploadFieldValue: (
    key: string,
    value: unknown
  ) => string;
};

export function Appraisal({
  canManageDocuments,
  departments,
  documentTypes,

  uploadedAppraisal,

  appraisalMetadataForm,
  appraisalAdditionalMetadata,
  appraisalCommittedAdditionalMetadata,

  appraisalRequiredFieldsComplete,
  appraisalDecisionLabel,
  appraisalIsLinked,

  matchedMetadata,

  reviewingDecision,
  reviewError,

  setAppraisalMetadataForm,
  setAppraisalAdditionalMetadata,
  setAppraisalCommittedAdditionalMetadata,

  handleAppraisalReview,

  FormField,
  StatusBadge,

  formatFileSize,
  formatUploadFieldLabel,
  formatUploadFieldValue,
}: AppraisalProps) {
  return (
                          <div className="mt-4 shrink-0 rounded-2xl border border-slate-200 bg-white text-left shadow-sm">
                            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    AI Appraisal
                                  </p>

                                  <h4 className="mt-1 text-lg font-bold text-slate-900">
                                    {uploadedAppraisal.matchType ===
                                    "NO_MATCH"
                                      ? "No metadata match found"
                                      : "Likely metadata match detected"}
                                  </h4>
                                </div>

                                <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                    Confidence
                                  </p>

                                  <p className="mt-1 text-2xl font-bold text-blue-600">
                                    {uploadedAppraisal.confidence}%
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-slate-200 bg-white p-5">
                              <div className="mb-4">
                                <h3 className="text-base font-semibold text-slate-900">
                                  Review & Edit Metadata
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                  Review the extracted metadata before linking this document.
                                  You may change, clear, or leave any field blank.
                                </p>
                              </div>

                              <div className="grid gap-4 md:grid-cols-2">
                                <label className="block">
                                  <span className="mb-1 block text-sm font-medium text-slate-700">
                                    Reference Code
                                  </span>
                                  <input
                                    type="text"
                                    value={appraisalMetadataForm.referenceCode}
                                    onChange={(event) =>
                                      setAppraisalMetadataForm((current) => ({
                                        ...current,
                                        referenceCode: event.target.value,
                                      }))
                                    }
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                                  />
                                </label>

                                <label className="block">
                                  <span className="mb-1 block text-sm font-medium text-slate-700">
                                    Title
                                  </span>
                                  <input
                                    type="text"
                                    value={appraisalMetadataForm.title}
                                    onChange={(event) =>
                                      setAppraisalMetadataForm((current) => ({
                                        ...current,
                                        title: event.target.value,
                                      }))
                                    }
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                                  />
                                </label>

                                <label className="block">
                                  <span className="mb-1 block text-sm font-medium text-slate-700">
                                    Document Date
                                  </span>
                                  <input
                                    type="date"
                                    value={appraisalMetadataForm.documentDate}
                                    onChange={(event) =>
                                      setAppraisalMetadataForm((current) => ({
                                        ...current,
                                        documentDate: event.target.value,
                                      }))
                                    }
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                                  />
                                </label>

                                <label className="block">
                                  <span className="mb-1 block text-sm font-medium text-slate-700">
                                    Year
                                  </span>
                                  <input
                                    type="number"
                                    value={appraisalMetadataForm.year}
                                    onChange={(event) =>
                                      setAppraisalMetadataForm((current) => ({
                                        ...current,
                                        year: event.target.value,
                                      }))
                                    }
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                                  />
                                </label>

                                <label className="block">
                                  <span className="mb-1 block text-sm font-medium text-slate-700">
                                    Person Name
                                  </span>
                                  <input
                                    type="text"
                                    value={appraisalMetadataForm.personName}
                                    onChange={(event) =>
                                      setAppraisalMetadataForm((current) => ({
                                        ...current,
                                        personName: event.target.value,
                                      }))
                                    }
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                                  />
                                </label>

                                <label className="block">
                                  <span className="mb-1 block text-sm font-medium text-slate-700">
                                    Department
                                  </span>
                                  <select
                                    value={appraisalMetadataForm.departmentId}
                                    onChange={(event) =>
                                      setAppraisalMetadataForm((current) => ({
                                        ...current,
                                        departmentId: event.target.value,
                                      }))
                                    }
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                                  >
                                    <option value="">None</option>
                                    {departments.map((department) => (
                                      <option
                                        key={department.id}
                                        value={department.id}
                                      >
                                        {department.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label className="block">
                                  <span className="mb-1 block text-sm font-medium text-slate-700">
                                    Document Type
                                  </span>
                                  <select
                                    value={appraisalMetadataForm.documentTypeId}
                                    onChange={(event) =>
                                      setAppraisalMetadataForm((current) => ({
                                        ...current,
                                        documentTypeId: event.target.value,
                                      }))
                                    }
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                                  >
                                    <option value="">None</option>
                                    {documentTypes.map((documentType) => (
                                      <option
                                        key={documentType.id}
                                        value={documentType.id}
                                      >
                                        {documentType.name}
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label className="block">
                                  <span className="mb-1 block text-sm font-medium text-slate-700">
                                    Section
                                  </span>
                                  <input
                                    type="text"
                                    value={appraisalMetadataForm.section}
                                    onChange={(event) =>
                                      setAppraisalMetadataForm((current) => ({
                                        ...current,
                                        section: event.target.value,
                                      }))
                                    }
                                    placeholder="e.g. Operations, Finance, Procurement"
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                                  />
                                </label>

                                <label className="block md:col-span-2">
                                  <span className="mb-1 block text-sm font-medium text-slate-700">
                                    Description
                                  </span>
                                  <textarea
                                    value={appraisalMetadataForm.description}
                                    onChange={(event) =>
                                      setAppraisalMetadataForm((current) => ({
                                        ...current,
                                        description: event.target.value,
                                      }))
                                    }
                                    rows={4}
                                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                                  />
                                </label>
                              </div>

                              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">
                                      Additional Metadata
                                    </h4>
                                    <p className="mt-1 text-xs leading-5 text-slate-500">
                                      Add document-specific fields discovered during
                                      appraisal. These are saved with the metadata
                                      record when you approve or create it.
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAppraisalAdditionalMetadata((current) => [
                                        ...current,
                                        {
                                          key: "",
                                          value: "",
                                        },
                                      ])
                                    }
                                    className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                  >
                                    + Add Field
                                  </button>
                                </div>

                                {appraisalCommittedAdditionalMetadata.length > 0 && (
                                  <div className="mt-4 space-y-2">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      Added Metadata
                                    </p>

                                    {appraisalCommittedAdditionalMetadata.map(
                                      (field, index) => (
                                        <div
                                          key={"committed-" + index}
                                          className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]"
                                        >
                                          <input
                                            type="text"
                                            value={field.key}
                                            onChange={(event) =>
                                              setAppraisalCommittedAdditionalMetadata(
                                                (current) =>
                                                  current.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,
                                                            key: event.target.value,
                                                          }
                                                        : item
                                                  )
                                              )
                                            }
                                            placeholder="Field name"
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                                          />

                                          <input
                                            type="text"
                                            value={field.value}
                                            onChange={(event) =>
                                              setAppraisalCommittedAdditionalMetadata(
                                                (current) =>
                                                  current.map(
                                                    (item, itemIndex) =>
                                                      itemIndex === index
                                                        ? {
                                                            ...item,
                                                            value: event.target.value,
                                                          }
                                                        : item
                                                  )
                                              )
                                            }
                                            placeholder="Value"
                                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                                          />

                                          <button
                                            type="button"
                                            onClick={() =>
                                              setAppraisalCommittedAdditionalMetadata(
                                                (current) =>
                                                  current.filter(
                                                    (_, itemIndex) =>
                                                      itemIndex !== index
                                                  )
                                              )
                                            }
                                            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-red-600"
                                          >
                                            Remove
                                          </button>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}

                                {appraisalAdditionalMetadata.length > 0 && (
                                  <div className="mt-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                      New Metadata Field
                                    </p>

                                    <div className="space-y-3">
                                      {appraisalAdditionalMetadata.map(
                                        (field, index) => (
                                          <div
                                            key={"draft-" + index}
                                            className="grid gap-3 sm:grid-cols-[1fr_1.5fr_auto]"
                                          >
                                            <input
                                              type="text"
                                              value={field.key}
                                              onChange={(event) =>
                                                setAppraisalAdditionalMetadata(
                                                  (current) =>
                                                    current.map(
                                                      (item, itemIndex) =>
                                                        itemIndex === index
                                                          ? {
                                                              ...item,
                                                              key: event.target.value,
                                                            }
                                                          : item
                                                    )
                                                )
                                              }
                                              placeholder="Field name"
                                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                                            />

                                            <input
                                              type="text"
                                              value={field.value}
                                              onChange={(event) =>
                                                setAppraisalAdditionalMetadata(
                                                  (current) =>
                                                    current.map(
                                                      (item, itemIndex) =>
                                                        itemIndex === index
                                                          ? {
                                                              ...item,
                                                              value: event.target.value,
                                                            }
                                                          : item
                                                    )
                                                )
                                              }
                                              placeholder="Value"
                                              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                                            />

                                            <div className="flex items-center gap-2">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const fieldKey = field.key.trim();
                                                  const fieldValue = field.value.trim();

                                                  if (!fieldKey) {
                                                    return;
                                                  }

                                                  setAppraisalCommittedAdditionalMetadata(
                                                    (current) => [
                                                      ...current,
                                                      {
                                                        key: fieldKey,
                                                        value: fieldValue,
                                                      },
                                                    ]
                                                  );

                                                  setAppraisalAdditionalMetadata(
                                                    (current) =>
                                                      current.map(
                                                        (item, itemIndex) =>
                                                          itemIndex === index
                                                            ? {
                                                                key: "",
                                                                value: "",
                                                              }
                                                            : item
                                                      )
                                                  );
                                                }}
                                                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                                              >
                                                + Add
                                              </button>

                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setAppraisalAdditionalMetadata(
                                                    (current) =>
                                                      current.filter(
                                                        (_, itemIndex) =>
                                                          itemIndex !== index
                                                      )
                                                  )
                                                }
                                                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white hover:text-red-600"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            {matchedMetadata && (
                              <div className="border-b border-slate-100 px-5 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                  Likely Metadata Record
                                </p>

                                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                    <div>
                                      <p className="text-lg font-bold text-blue-700">
                                        {matchedMetadata.reference_code}
                                      </p>

                                      <p className="mt-1 font-semibold text-slate-900">
                                        {matchedMetadata.title ||
                                          "Untitled document"}
                                      </p>

                                      {matchedMetadata.person_name && (
                                        <p className="mt-1 text-sm text-slate-600">
                                          {matchedMetadata.person_name}
                                        </p>
                                      )}
                                    </div>

                                    <div className="text-left text-xs text-slate-500 sm:text-right">
                                      <p>
                                        {matchedMetadata.department_name ||
                                          "No department"}
                                      </p>

                                      <p className="mt-1">
                                        {matchedMetadata.document_type_name ||
                                          "No document type"}
                                      </p>

                                      {matchedMetadata.year && (
                                        <p className="mt-1">
                                          {matchedMetadata.year}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {uploadedAppraisal.matchingFields.length > 0 && (
                              <div className="border-b border-slate-100 px-5 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                  Matching Information
                                </p>

                                <div className="mt-3 space-y-2">
                                  {uploadedAppraisal.matchingFields.map(
                                    (field) => (
                                      <div
                                        key={field}
                                        className="flex items-center gap-2 text-sm text-slate-700"
                                      >
                                        <span
                                          aria-hidden="true"
                                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700"
                                        >
                                          ✓
                                        </span>

                                        <span>
                                          {field}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            {uploadedAppraisal.conflictingFields.length > 0 && (
                              <div className="border-b border-slate-100 px-5 py-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                  Conflicting Information
                                </p>

                                <div className="mt-3 space-y-3">
                                  {uploadedAppraisal.metadataConflicts &&
                                  uploadedAppraisal.metadataConflicts.length > 0 ? (
                                    uploadedAppraisal.metadataConflicts.map(
                                      (conflict) => (
                                        <div
                                          key={conflict.field}
                                          className="rounded-xl border border-amber-200 bg-amber-50 p-3"
                                        >
                                          <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                                            <span
                                              aria-hidden="true"
                                              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold"
                                            >
                                              !
                                            </span>

                                            <span>
                                              {conflict.field}
                                            </span>
                                          </div>

                                          <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-lg bg-white p-3">
                                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                Existing metadata
                                              </p>
                                              <p className="mt-1 text-sm text-slate-700">
                                                {conflict.existingValue ??
                                                  "Blank"}
                                              </p>
                                            </div>

                                            <div className="rounded-lg bg-white p-3">
                                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                Document says
                                              </p>
                                              <p className="mt-1 text-sm text-slate-700">
                                                {conflict.documentValue ??
                                                  "Blank"}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    )
                                  ) : (
                                    uploadedAppraisal.conflictingFields.map(
                                      (field) => (
                                        <div
                                          key={field}
                                          className="flex items-center gap-2 text-sm text-amber-800"
                                        >
                                          <span
                                            aria-hidden="true"
                                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold"
                                          >
                                            !
                                          </span>

                                          <span>
                                            {field}
                                          </span>
                                        </div>
                                      )
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="px-5 py-4">
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Decision
                              </p>

                              <div className="mt-2 flex flex-wrap items-center gap-3">
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                                  {appraisalDecisionLabel}
                                </span>

                                {appraisalIsLinked && (
                                  <span className="text-sm font-semibold text-emerald-700">
                                    Document linked successfully.
                                  </span>
                                )}
                              </div>

                              {!appraisalIsLinked &&
                                uploadedAppraisal.matchType !==
                                  "NO_MATCH" && (
                                  <p className="mt-3 text-sm leading-6 text-slate-600">
                                    The system found a likely metadata match.
                                    No link has been created automatically.
                                    Please review the recommendation before
                                    changing the record relationship.
                                  </p>
                                )}



                              {reviewError && (
                                <div
                                  role="alert"
                                  aria-live="assertive"
                                  className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                                >
                                  {reviewError}
                                </div>
                              )}

                              {uploadedAppraisal.decision !== "LINKED" &&
                                uploadedAppraisal.decision !==
                                  "NEW_METADATA_CREATED" && (
                                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                                    {canManageDocuments && uploadedAppraisal.metadataRecordId && (
      <button
                                        type="button"
                                        disabled={reviewingDecision}
                                        onClick={() =>
                                          void handleAppraisalReview(
                                            "APPROVE"
                                          )
                                        }
                                        className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {reviewingDecision
                                          ? "Processing..."
                                          : "Approve & Link"}
                                      </button>
                                    )}

                                    {canManageDocuments && uploadedAppraisal.metadataRecordId && (
      <button
                                        type="button"
                                        disabled={reviewingDecision}
                                        onClick={() =>
                                          void handleAppraisalReview(
                                            "REJECT"
                                          )
                                        }
                                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        Reject Match
                                      </button>
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>
  );
}