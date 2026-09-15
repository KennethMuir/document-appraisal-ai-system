"use client";

import type {
  Dispatch,
  ReactElement,
  SetStateAction,
} from "react";

import type {
  UploadedDocument,
} from "@/types/documents";

import type {
  MetadataRecord,
} from "@/types/metadata";

type DocumentsProps = {
  documents:
    UploadedDocument[];

  dashboardFilteredDocuments:
    UploadedDocument[];

  metadata:
    MetadataRecord[];

  dashboardDocumentFilter:
    | "ALL"
    | "LINKED"
    | "UNLINKED"
    | "REVIEW";

  canManageDocuments:
    boolean;

  loading:
    boolean;

  setShowUploadModal:
    Dispatch<
      SetStateAction<boolean>
    >;

  setReviewError:
    Dispatch<
      SetStateAction<string>
    >;

  handleOpenDocument:
    (documentId: string | number) => void;

  formatFileSize:
    (bytes:
      number |
      null |
      undefined
    ) => string;

  StatusBadge:
    (props: {
      status: string;
    }) => ReactElement;
};

export function Documents({
  documents,
  dashboardFilteredDocuments,
  metadata,
  dashboardDocumentFilter,
  canManageDocuments,
  loading,
  setShowUploadModal,
  setReviewError,
  handleOpenDocument,
  formatFileSize,
  StatusBadge,
}: DocumentsProps) {
  return (
    <>
<div className="mb-8 rounded-2xl bg-slate-900 p-7 text-white">
                  <p className="text-sm font-semibold text-slate-300">
                    DOCUMENT LIBRARY
                  </p>

                  <h2 className="mt-2 text-3xl font-bold">
                    Institutional Document Library
                  </h2>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                    Securely store, identify and organize incoming PDF and
                    DOCX records. Each uploaded document receives a unique
                    system document code.
                  </p>

                  {canManageDocuments && (
<button
                    type="button"
                    onClick={() =>
                      setShowUploadModal(
                        true
                      )
                    }
                    className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    + Upload Document
                  </button>
                  )}
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-5">
                    <h3 className="font-bold">
                      Uploaded Documents
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {dashboardDocumentFilter === "ALL"
                        ? "Documents currently stored in the records system."
                        : dashboardDocumentFilter === "LINKED"
                          ? "Showing documents linked to metadata."
                          : dashboardDocumentFilter === "UNLINKED"
                            ? "Showing documents requiring appraisal."
                            : "Showing documents requiring review."}
                    </p>
                  </div>

                  {loading ? (
                    <div
                      role="status"
                      aria-live="polite"
                      className="p-10 text-center text-sm text-slate-500"
                    >
                      Loading documents...
                    </div>
                  ) : dashboardFilteredDocuments.length ===
                    0 ? (
                    <div className="p-12 text-center">
                      <div
                        aria-hidden="true"
                        className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100"
                      >
                        ▣
                      </div>

                      <h3 className="mt-4 font-bold">
                        No documents uploaded
                      </h3>

                      <p className="mt-2 text-sm text-slate-500">
                        Upload your first PDF or DOCX document to begin
                        the appraisal workflow.
                      </p>

                      {canManageDocuments && (
<button
                        type="button"
                        onClick={() =>
                          setShowUploadModal(
                            true
                          )
                        }
                        className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                      >
                        Upload Document
                      </button>
                        )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                          <tr>
                            <th className="px-5 py-4 font-semibold">
                              Document Code
                            </th>

                            <th className="px-5 py-4 font-semibold">
                              Filename
                            </th>

                            <th className="px-5 py-4 font-semibold">
                              Type
                            </th>

                            <th className="px-5 py-4 font-semibold">
                              Size
                            </th>

                            <th className="px-5 py-4 font-semibold">
                              Status
                            </th>
                            <th className="px-5 py-4 text-right font-semibold">
                              Action
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {dashboardFilteredDocuments.map(
                            (document) => (
                              <tr
                                key={
                                  document.id
                                }
                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                              >
                                <td className="px-5 py-5">
                                  <span className="font-bold text-blue-600">
                                    {
                                      document.document_code ??
                                      "—"
                                    }
                                  </span>
                                </td>

                                <td className="px-5 py-5 font-medium">
                                  {
                                    document.filename ??
                                    "—"
                                  }
                                </td>

                                <td className="px-5 py-5">
                                  {
                                    document.file_type ??
                                    "—"
                                  }
                                </td>

                                <td className="px-5 py-5">
                                  {formatFileSize(
                                    document.file_size
                                  )}
                                </td>

                                <td className="px-5 py-5">
                                  <StatusBadge
                                    status={
                                      document.status ??
                                      "UNKNOWN"
                                    }
                                  />
                                </td>
                                <td className="px-5 py-5 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (document.id == null) {
                                        setReviewError(
                                          "This document does not have a valid document ID."
                                        );
                                        return;
                                      }

                                      handleOpenDocument(
                                        document.id
                                      );
                                    }}
                                    className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                                  >
                                    Open
                                  </button>
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
    </>
  );
}
