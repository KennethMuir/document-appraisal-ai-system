    "use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  ChangeEvent,
  FormEvent,
  ReactNode,
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Statistics = {
  documents: string | number;
  metadata: string | number;
  departments: string | number;
  linked: string | number;
  awaiting: string | number;
  review: string | number;
  unlinked: string | number;
};

type Department = {
  id: number;
  name: string;
  code: string;
  description: string;
};

type DocumentType = {
  id: number;
  name: string;
  description: string;
};

type MetadataRecord = {
  id: string;
  reference_code: string;
  title: string | null;
  document_date: string | null;
  year: number | null;
  person_name: string | null;
  description: string | null;
  status: string;
  department_name: string | null;
  document_type_name: string | null;
  linked_document_id: string | null;
  linked_document_code: string | null;
  linked_filename: string | null;
};

type UploadedDocument = {
  [key: string]: unknown;
  id?: string | number;
  document_code?: string;
  filename?: string;
  file_type?: string;
  file_size?: number;
  status?: string;
};

type ApiResponse<T = unknown> = {
  success?: boolean;
  error?: string;
  [key: string]: unknown;
} & T;

const statCards = [
  {
    key: "documents",
    label: "Total Documents",
    description: "Documents stored in the system",
    icon: "▣",
  },
  {
    key: "metadata",
    label: "Metadata Records",
    description: "Pre-fed and registered records",
    icon: "◫",
  },
  {
    key: "awaiting",
    label: "Awaiting Documents",
    description: "Metadata waiting for a physical file",
    icon: "◷",
  },
  {
    key: "review",
    label: "Needs Review",
    description: "Potential matches requiring a decision",
    icon: "!",
  },
  {
    key: "linked",
    label: "Linked Documents",
    description: "Documents matched to metadata",
    icon: "✓",
  },
  {
    key: "unlinked",
    label: "Unlinked Documents",
    description: "Documents requiring appraisal",
    icon: "○",
  },
] as const;

const EMPTY_FORM = {
  referenceCode: "",
  personName: "",
  title: "",
  departmentId: "",
  documentTypeId: "",
  year: "",
  documentDate: "",
  description: "",
};

export default function Home() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [statistics, setStatistics] =
    useState<Statistics | null>(null);

  const [metadata, setMetadata] =
    useState<MetadataRecord[]>([]);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [documentTypes, setDocumentTypes] =
    useState<DocumentType[]>([]);

  const [documents, setDocuments] =
    useState<UploadedDocument[]>([]);

  const [loading, setLoading] = useState(true);

  const [showMetadataModal, setShowMetadataModal] =
    useState(false);

  const [showUploadModal, setShowUploadModal] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [uploadError, setUploadError] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploadedDocument, setUploadedDocument] =
    useState<UploadedDocument | null>(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const appContentRef =
    useRef<HTMLDivElement | null>(null);

  const modalRef =
    useRef<HTMLDivElement | null>(null);

  const modalCloseButtonRef =
    useRef<HTMLButtonElement | null>(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        dashboardResponse,
        metadataResponse,
        departmentsResponse,
        typesResponse,
        documentsResponse,
      ] = await Promise.all([
        fetch(`${API_URL}/api/dashboard`),
        fetch(`${API_URL}/api/metadata`),
        fetch(`${API_URL}/api/departments`),
        fetch(`${API_URL}/api/document-types`),
        fetch(`${API_URL}/api/documents`),
      ]);

      const [
        dashboardData,
        metadataData,
        departmentsData,
        typesData,
        documentsData,
      ] = await Promise.all([
        dashboardResponse.json(),
        metadataResponse.json(),
        departmentsResponse.json(),
        typesResponse.json(),
        documentsResponse.json(),
      ]);

      if (dashboardData.success) {
        setStatistics(
          dashboardData.statistics ??
            dashboardData.dashboard ??
            null
        );
      }

      if (metadataData.success) {
        setMetadata(
          Array.isArray(metadataData.metadata)
            ? metadataData.metadata
            : []
        );
      }

      if (departmentsData.success) {
        setDepartments(
          Array.isArray(departmentsData.departments)
            ? departmentsData.departments
            : []
        );
      }

      if (typesData.success) {
        setDocumentTypes(
          Array.isArray(typesData.documentTypes)
            ? typesData.documentTypes
            : []
        );
      }

      if (documentsData.success) {
        setDocuments(
          Array.isArray(documentsData.documents)
            ? documentsData.documents
            : []
        );
      }
    } catch (error) {
      console.error(
        "Unable to load system data:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  /*
   * =============================================================
   * ACCESSIBLE MODAL BEHAVIOR
   * =============================================================
   */

  useEffect(() => {
    const modalIsOpen =
      showMetadataModal || showUploadModal;

    if (!modalIsOpen) {
      return;
    }

    const previouslyFocusedElement =
      document.activeElement as HTMLElement | null;

    const previousBodyOverflow =
      document.body.style.overflow;

    document.body.style.overflow = "hidden";

    if (appContentRef.current) {
      appContentRef.current.inert = true;
      appContentRef.current.setAttribute(
        "aria-hidden",
        "true"
      );
    }

    const focusTimer =
      window.requestAnimationFrame(() => {
        modalCloseButtonRef.current?.focus();
      });

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (uploading) {
          return;
        }

        if (showUploadModal) {
          closeUploadModal();
        } else if (showMetadataModal) {
          setShowMetadataModal(false);
        }

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const modal = modalRef.current;

      if (!modal) {
        return;
      }

      const focusableElements =
        modal.querySelectorAll<HTMLElement>(
          [
            'a[href]',
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            '[tabindex]:not([tabindex="-1"])',
          ].join(",")
        );

      const visibleFocusableElements =
        Array.from(focusableElements).filter(
          (element) => {
            const style =
              window.getComputedStyle(element);

            return (
              style.display !== "none" &&
              style.visibility !== "hidden"
            );
          }
        );

      if (
        visibleFocusableElements.length === 0
      ) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const firstElement =
        visibleFocusableElements[0];

      const lastElement =
        visibleFocusableElements[
          visibleFocusableElements.length - 1
        ];

      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.cancelAnimationFrame(
        focusTimer
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        previousBodyOverflow;

      if (appContentRef.current) {
        appContentRef.current.inert = false;
        appContentRef.current.removeAttribute(
          "aria-hidden"
        );
      }

      window.requestAnimationFrame(() => {
        if (
          previouslyFocusedElement &&
          document.contains(
            previouslyFocusedElement
          )
        ) {
          previouslyFocusedElement.focus();
        }
      });
    };
  }, [
    showMetadataModal,
    showUploadModal,
    uploading,
  ]);

  /*
   * =============================================================
   * METADATA SUBMISSION
   * =============================================================
   */

  const handleMetadataSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      const response = await fetch(
        `${API_URL}/api/metadata`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            referenceCode:
              form.referenceCode.trim(),
            personName:
              form.personName.trim() || null,
            title:
              form.title.trim() || null,
            departmentId:
              form.departmentId || null,
            documentTypeId:
              form.documentTypeId || null,
            year:
              form.year || null,
            documentDate:
              form.documentDate || null,
            description:
              form.description.trim() || null,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Unable to create metadata record."
        );
      }

      setShowMetadataModal(false);
      setForm({ ...EMPTY_FORM });

      await loadData();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to create metadata record."
      );
    }
  };

  /*
   * =============================================================
   * FILE SELECTION
   * =============================================================
   */

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0] ?? null;

    setUploadError("");
    setUploadedDocument(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const extension =
      file.name
        .toLowerCase()
        .split(".")
        .pop();

    if (
      !allowedTypes.includes(file.type) &&
      extension !== "pdf" &&
      extension !== "docx"
    ) {
      setUploadError(
        "Only PDF and DOCX documents are currently supported."
      );

      setSelectedFile(null);
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
  };

  /*
   * =============================================================
   * DOCUMENT UPLOAD
   * =============================================================
   */

  const handleUpload = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedFile) {
      setUploadError(
        "Please select a PDF or DOCX document."
      );
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadedDocument(null);

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response =
        await fetch(
          `${API_URL}/api/documents/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Document upload failed."
        );
      }

      if (
        !data.document ||
        typeof data.document !== "object"
      ) {
        throw new Error(
          "Document uploaded, but the API returned an invalid document response."
        );
      }

      setUploadedDocument(
        data.document as UploadedDocument
      );

      setSelectedFile(null);

      const fileInput =
        document.getElementById(
          "document-upload"
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await loadData();
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Unable to upload document."
      );
    } finally {
      setUploading(false);
    }
  };

  /*
   * =============================================================
   * CLOSE UPLOAD MODAL
   * =============================================================
   */

  const closeUploadModal = () => {
    if (uploading) {
      return;
    }

    setShowUploadModal(false);
    setSelectedFile(null);
    setUploadError("");
    setUploadedDocument(null);
  };

  /*
   * =============================================================
   * FORMATTING
   * =============================================================
   */

  const formatUploadFieldLabel = (
    key: string
  ) => {
    return key
      .replace(
        /([a-z])([A-Z])/g,
        "$1 $2"
      )
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  const formatDate = (
    value: string | null
  ) => {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return value;
    }

    return date.toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone:
          "Africa/Nairobi",
      }
    );
  };

  const formatFileSize = (
    bytes: number | undefined
  ) => {
    if (
      bytes === undefined ||
      bytes === null ||
      bytes <= 0
    ) {
      return "0 KB";
    }

    if (
      bytes <
      1024 * 1024
    ) {
      return `${Math.round(
        bytes / 1024
      )} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  };

  const formatUploadFieldValue = (
    key: string,
    value: unknown
  ): string => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "—";
    }

    if (
      key === "file_size" &&
      typeof value === "number"
    ) {
      return formatFileSize(value);
    }

    if (
      key.includes("date") ||
      key === "created_at" ||
      key === "updated_at" ||
      key === "upload_date"
    ) {
      if (
        typeof value === "string"
      ) {
        return formatDate(value);
      }
    }

    if (
      typeof value === "boolean"
    ) {
      return value
        ? "Yes"
        : "No";
    }

    if (
      typeof value === "object"
    ) {
      try {
        return JSON.stringify(
          value,
          null,
          2
        );
      } catch {
        return String(value);
      }
    }

    return String(value);
  };

  const getStatValue = (
    key: string
  ) => {
    if (
      loading ||
      !statistics
    ) {
      return "—";
    }

    return (
      statistics[
        key as keyof Statistics
      ] ?? "0"
    );
  };

  /*
   * =============================================================
   * FILTERED METADATA
   * =============================================================
   */

  const normalizedSearchTerm =
    searchTerm
      .trim()
      .toLowerCase();

  const filteredMetadata =
    metadata.filter(
      (record) => {
        if (!normalizedSearchTerm) {
          return true;
        }

        return [
          record.reference_code,
          record.title,
          record.person_name,
          record.department_name,
          record.document_type_name,
          record.linked_document_code,
          record.linked_filename,
          record.status,
        ]
          .filter(
            (
              value
            ): value is string =>
              Boolean(value)
          )
          .some((value) =>
            value
              .toLowerCase()
              .includes(
                normalizedSearchTerm
              )
          );
      }
    );

  const uploadFieldEntries =
    uploadedDocument
      ? Object.entries(
          uploadedDocument
        )
      : [];

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-900">
      <div
        ref={appContentRef}
        className="flex min-h-screen"
      >
        {/* ========================================================= */}
        {/* SIDEBAR */}
        {/* ========================================================= */}

        <aside className="hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
                DA
              </div>

              <div>
                <p className="text-sm font-bold tracking-tight">
                  Document Appraisal
                </p>

                <p className="text-xs text-slate-500">
                  AI System
                </p>
              </div>
            </div>
          </div>

          <nav
            aria-label="Main navigation"
            className="flex-1 space-y-1 px-3 py-5"
          >
            <NavItem
              active={
                activePage === "Dashboard"
              }
              icon="⌂"
              label="Dashboard"
              onClick={() =>
                setActivePage(
                  "Dashboard"
                )
              }
            />

            <NavItem
              active={
                activePage === "Documents"
              }
              icon="▣"
              label="Documents"
              onClick={() =>
                setActivePage(
                  "Documents"
                )
              }
            />

            <NavItem
              active={
                activePage ===
                "Metadata Registry"
              }
              icon="◫"
              label="Metadata"
              onClick={() =>
                setActivePage(
                  "Metadata Registry"
                )
              }
            />

            <NavItem
              active={
                activePage === "Search"
              }
              icon="⌕"
              label="Search"
              onClick={() =>
                setActivePage(
                  "Search"
                )
              }
            />

            <NavItem
              active={
                activePage === "Departments"
              }
              icon="▤"
              label="Departments"
              onClick={() =>
                setActivePage(
                  "Departments"
                )
              }
            />

            <NavItem
              active={
                activePage === "Settings"
              }
              icon="⚙"
              label="Settings"
              onClick={() =>
                setActivePage(
                  "Settings"
                )
              }
            />
          </nav>

          <div className="border-t border-slate-200 p-4">
            <button
              type="button"
              onClick={() =>
                setShowUploadModal(
                  true
                )
              }
              className="mb-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              + Upload Document
            </button>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                System status
              </p>

              <div className="mt-3 flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-full bg-emerald-500"
                />

                <span className="text-sm font-medium text-slate-700">
                  API connected
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* MAIN */}
        {/* ========================================================= */}

        <section className="flex-1">
          <header className="border-b border-slate-200 bg-white">
            <div className="flex flex-col justify-between gap-4 px-6 py-5 md:flex-row md:items-center lg:px-10">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Records intelligence
                </p>

                <h1 className="mt-1 text-2xl font-bold tracking-tight">
                  {activePage}
                </h1>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setActivePage(
                      "Search"
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  Search
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowUploadModal(
                      true
                    )
                  }
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  + Upload Document
                </button>
              </div>
            </div>
          </header>

          {/* ======================================================= */}
          {/* CONTENT */}
          {/* ======================================================= */}

          <div className="px-6 py-8 lg:px-10">
            {/* ===================================================== */}
            {/* DASHBOARD */}
            {/* ===================================================== */}

            {activePage ===
              "Dashboard" && (
              <>
                <div className="mb-8 rounded-2xl bg-slate-900 p-7 text-white shadow-sm">
                  <div className="max-w-3xl">
                    <p className="text-sm font-semibold text-slate-300">
                      DOCUMENT APPRAISAL AI
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight">
                      Intelligent control of your institutional records.
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                      Register metadata before documents arrive, analyze
                      incoming files, identify possible matches, and maintain
                      a searchable relationship between metadata and physical
                      records.
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setShowMetadataModal(
                          true
                        )
                      }
                      className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                      + Add Metadata
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActivePage(
                          "Documents"
                        )
                      }
                      className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900"
                    >
                      Browse Documents
                    </button>
                  </div>
                </div>

                <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {statCards.map(
                    (card) => (
                      <div
                        key={
                          card.key
                        }
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500">
                              {
                                card.label
                              }
                            </p>

                            <p className="mt-2 text-3xl font-bold tracking-tight">
                              {getStatValue(
                                card.key
                              )}
                            </p>
                          </div>

                          <div
                            aria-hidden="true"
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700"
                          >
                            {
                              card.icon
                            }
                          </div>
                        </div>

                        <p className="mt-3 text-xs leading-5 text-slate-400">
                          {
                            card.description
                          }
                        </p>
                      </div>
                    )
                  )}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                      <div>
                        <h3 className="font-bold">
                          Department Records
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          Browse records by organizational department.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setActivePage(
                            "Departments"
                          )
                        }
                        className="rounded-lg text-sm font-semibold text-slate-700 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                      >
                        View all
                      </button>
                    </div>

                    <div className="grid gap-3 p-5 sm:grid-cols-2">
                      {departments
                        .slice(0, 8)
                        .map(
                          (
                            department
                          ) => (
                            <button
                              type="button"
                              key={
                                department.id
                              }
                              onClick={() =>
                                setActivePage(
                                  "Departments"
                                )
                              }
                              className="group rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div
                                    aria-hidden="true"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700"
                                  >
                                    {department.code.slice(
                                      0,
                                      2
                                    )}
                                  </div>

                                  <div>
                                    <p className="text-sm font-semibold">
                                      {
                                        department.name
                                      }
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-400">
                                      {
                                        department.code
                                      }
                                    </p>
                                  </div>
                                </div>

                                <span
                                  aria-hidden="true"
                                  className="text-slate-300 transition group-hover:text-slate-600"
                                >
                                  →
                                </span>
                              </div>
                            </button>
                          )
                        )}
                    </div>
                  </section>

                  <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-6 py-5">
                      <h3 className="font-bold">
                        Appraisal Workflow
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        How the system handles incoming records.
                      </p>
                    </div>

                    <div className="space-y-5 p-6">
                      <WorkflowStep
                        number="01"
                        title="Metadata first"
                        text="Create an expected record before the physical document arrives."
                      />

                      <WorkflowStep
                        number="02"
                        title="Document arrives"
                        text="Upload a PDF or DOCX and preserve its physical file securely."
                      />

                      <WorkflowStep
                        number="03"
                        title="Appraisal"
                        text="Extract available information and compare it against existing metadata."
                      />

                      <WorkflowStep
                        number="04"
                        title="Decision"
                        text="Strong matches link automatically; uncertain matches require user review."
                      />
                    </div>
                  </section>
                </div>

                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6">
                  <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-sm font-bold">
                        Ready to register a record?
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Add metadata now, even if the physical document has
                        not arrived yet.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setShowMetadataModal(
                          true
                        )
                      }
                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                    >
                      Create Metadata Record
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ===================================================== */}
            {/* METADATA REGISTRY */}
            {/* ===================================================== */}

            {activePage ===
              "Metadata Registry" && (
              <>
                <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <SummaryCard
                    label="Metadata Records"
                    value={
                      metadata.length
                    }
                  />

                  <SummaryCard
                    label="Awaiting Documents"
                    value={
                      metadata.filter(
                        (item) =>
                          item.status ===
                          "AWAITING_DOCUMENT"
                      ).length
                    }
                  />

                  <SummaryCard
                    label="Linked"
                    value={
                      metadata.filter(
                        (item) =>
                          Boolean(
                            item.linked_document_id
                          )
                      ).length
                    }
                  />

                  <SummaryCard
                    label="Departments"
                    value={
                      departments.length
                    }
                  />
                </div>

                <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Metadata management
                    </p>

                    <h2 className="mt-1 text-xl font-bold">
                      Pre-fed Metadata
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Register expected documents before the physical file
                      arrives.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowMetadataModal(
                        true
                      )
                    }
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                  >
                    + Register Metadata
                  </button>
                </div>

                <div className="mb-5 flex items-center gap-3">
                  <div className="relative flex-1">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      ⌕
                    </span>

                    <input
                      aria-label="Search metadata records"
                      value={
                        searchTerm
                      }
                      onChange={(
                        event
                      ) =>
                        setSearchTerm(
                          event.target
                            .value
                        )
                      }
                      placeholder="Search reference, person, title, department..."
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {loading ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      Loading metadata registry...
                    </div>
                  ) : filteredMetadata.length ===
                    0 ? (
                    <div className="p-12 text-center">
                      <div
                        aria-hidden="true"
                        className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-lg"
                      >
                        ◫
                      </div>

                      <h3 className="mt-4 font-bold">
                        No metadata records found
                      </h3>

                      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                        Register expected document information before
                        uploading physical documents.
                      </p>

                      <button
                        type="button"
                        onClick={() =>
                          setShowMetadataModal(
                            true
                          )
                        }
                        className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                      >
                        + Register Metadata
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b border-slate-200 bg-slate-50">
                          <tr>
                            <th className="px-5 py-4 font-semibold">
                              Reference
                            </th>

                            <th className="px-5 py-4 font-semibold">
                              Document
                            </th>

                            <th className="px-5 py-4 font-semibold">
                              Person
                            </th>

                            <th className="px-5 py-4 font-semibold">
                              Department
                            </th>

                            <th className="px-5 py-4 font-semibold">
                              Type
                            </th>

                            <th className="px-5 py-4 font-semibold">
                              Date
                            </th>

                            <th className="px-5 py-4 font-semibold">
                              Status
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredMetadata.map(
                            (record) => (
                              <tr
                                key={
                                  record.id
                                }
                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                              >
                                <td className="px-5 py-5">
                                  <div className="font-semibold">
                                    {
                                      record.reference_code
                                    }
                                  </div>
                                </td>

                                <td className="px-5 py-5">
                                  <div className="font-medium">
                                    {
                                      record.title ||
                                      "Untitled"
                                    }
                                  </div>

                                  {record.linked_document_code && (
                                    <div className="mt-1 text-xs font-semibold text-blue-600">
                                      {
                                        record.linked_document_code
                                      }
                                    </div>
                                  )}
                                </td>

                                <td className="px-5 py-5">
                                  {
                                    record.person_name ||
                                    "—"
                                  }
                                </td>

                                <td className="px-5 py-5">
                                  {
                                    record.department_name ||
                                    "—"
                                  }
                                </td>

                                <td className="px-5 py-5">
                                  {
                                    record.document_type_name ||
                                    "—"
                                  }
                                </td>

                                <td className="px-5 py-5">
                                  {formatDate(
                                    record.document_date
                                  )}
                                </td>

                                <td className="px-5 py-5">
                                  <StatusBadge
                                    status={
                                      record.status
                                    }
                                  />
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ===================================================== */}
            {/* DOCUMENTS */}
            {/* ===================================================== */}

            {activePage ===
              "Documents" && (
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
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-5">
                    <h3 className="font-bold">
                      Uploaded Documents
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Documents currently stored in the records system.
                    </p>
                  </div>

                  {loading ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                      Loading documents...
                    </div>
                  ) : documents.length ===
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
                          </tr>
                        </thead>

                        <tbody>
                          {documents.map(
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
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}

            {/* ===================================================== */}
            {/* SEARCH */}
            {/* ===================================================== */}

            {activePage ===
              "Search" && (
              <>
                <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Records intelligence
                  </p>

                  <h2 className="mt-2 text-3xl font-bold">
                    Search the records
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                    Search across registered metadata using reference codes,
                    people, titles, departments, document types and linked
                    documents.
                  </p>

                  <div className="relative mt-6">
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      ⌕
                    </span>

                    <input
                      aria-label="Search records"
                      value={
                        searchTerm
                      }
                      onChange={(
                        event
                      ) =>
                        setSearchTerm(
                          event.target
                            .value
                        )
                      }
                      placeholder="Search records..."
                      className="w-full rounded-xl border border-slate-200 px-11 py-4 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-5">
                    <h3 className="font-bold">
                      Search Results
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {searchTerm
                        ? `${filteredMetadata.length} matching metadata record(s)`
                        : "Enter a search term to explore the registry."}
                    </p>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {searchTerm &&
                      filteredMetadata.map(
                        (record) => (
                          <div
                            key={
                              record.id
                            }
                            className="p-6 transition hover:bg-slate-50"
                          >
                            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                              <div>
                                <div className="flex flex-wrap items-center gap-3">
                                  <span className="font-bold text-blue-600">
                                    {
                                      record.reference_code
                                    }
                                  </span>

                                  <StatusBadge
                                    status={
                                      record.status
                                    }
                                  />
                                </div>

                                <h4 className="mt-2 font-bold">
                                  {
                                    record.title ||
                                    "Untitled document"
                                  }
                                </h4>

                                <p className="mt-1 text-sm text-slate-500">
                                  {
                                    record.person_name ||
                                    "No person recorded"
                                  }
                                  {" · "}
                                  {
                                    record.department_name ||
                                    "No department"
                                  }
                                  {" · "}
                                  {
                                    record.document_type_name ||
                                    "No type"
                                  }
                                </p>
                              </div>

                              {record.linked_document_code && (
                                <div className="rounded-xl bg-blue-50 px-4 py-3">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                                    Linked document
                                  </p>

                                  <p className="mt-1 font-bold text-blue-700">
                                    {
                                      record.linked_document_code
                                    }
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      )}

                    {searchTerm &&
                      filteredMetadata.length ===
                        0 && (
                        <div className="p-12 text-center">
                          <p className="font-semibold">
                            No matching records
                          </p>

                          <p className="mt-2 text-sm text-slate-500">
                            Try a different reference, name, title or
                            department.
                          </p>
                        </div>
                      )}

                    {!searchTerm && (
                      <div className="p-12 text-center">
                        <div
                          aria-hidden="true"
                          className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-lg"
                        >
                          ⌕
                        </div>

                        <p className="mt-4 font-semibold">
                          Search your records
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          Search by reference code, person, document title,
                          department or document type.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </>
            )}

            {/* ===================================================== */}
            {/* DEPARTMENTS */}
            {/* ===================================================== */}

            {activePage ===
              "Departments" && (
              <>
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Organizational structure
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Departments
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Browse the organizational departments used to classify
                    institutional records.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {departments.map(
                    (department) => (
                      <div
                        key={
                          department.id
                        }
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div
                            aria-hidden="true"
                            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700"
                          >
                            {department.code.slice(
                              0,
                              2
                            )}
                          </div>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {
                              department.code
                            }
                          </span>
                        </div>

                        <h3 className="mt-5 text-lg font-bold">
                          {
                            department.name
                          }
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {
                            department.description ||
                            "No department description available."
                          }
                        </p>
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            {/* ===================================================== */}
            {/* SETTINGS */}
            {/* ===================================================== */}

            {activePage ===
              "Settings" && (
              <>
                <div className="mb-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    System configuration
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Settings
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    Basic system information and current configuration.
                  </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <SettingsCard
                    title="Document Processing"
                    description="Current document formats accepted by the system."
                  >
                    <SettingRow
                      label="PDF documents"
                      value="Supported"
                    />

                    <SettingRow
                      label="DOCX documents"
                      value="Supported"
                    />

                    <SettingRow
                      label="OCR"
                      value="Planned"
                    />
                  </SettingsCard>

                  <SettingsCard
                    title="System Connection"
                    description="Application connectivity information."
                  >
                    <SettingRow
                      label="API"
                      value="Connected"
                    />

                    <SettingRow
                      label="Database"
                      value="PostgreSQL"
                    />

                    <SettingRow
                      label="Environment"
                      value="Local"
                    />
                  </SettingsCard>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* =========================================================== */}
      {/* METADATA MODAL */}
      {/* =========================================================== */}

      {showMetadataModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowMetadataModal(false);
            }
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="metadata-modal-title"
            aria-describedby="metadata-modal-description"
            tabIndex={-1}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl outline-none"
          >
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Metadata registry
                  </p>

                  <h2
                    id="metadata-modal-title"
                    className="mt-1 text-xl font-bold"
                  >
                    Register Metadata
                  </h2>

                  <p
                    id="metadata-modal-description"
                    className="mt-1 text-sm text-slate-500"
                  >
                    Create an expected record before the physical document
                    arrives.
                  </p>
                </div>

                <button
                  ref={
                    modalCloseButtonRef
                  }
                  type="button"
                  onClick={() =>
                    setShowMetadataModal(
                      false
                    )
                  }
                  aria-label="Close metadata registration dialog"
                  className="ml-4 rounded-lg p-2 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  <span aria-hidden="true">
                    ×
                  </span>
                </button>
              </div>
            </div>

            <form
              onSubmit={
                handleMetadataSubmit
              }
              className="space-y-5 p-6"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  label="Reference Code *"
                  value={
                    form.referenceCode
                  }
                  onChange={(value) =>
                    setForm({
                      ...form,
                      referenceCode:
                        value,
                    })
                  }
                  placeholder="HR-002"
                  required
                />

                <FormField
                  label="Person Name"
                  value={
                    form.personName
                  }
                  onChange={(value) =>
                    setForm({
                      ...form,
                      personName:
                        value,
                    })
                  }
                  placeholder="Ian Mwangi"
                />
              </div>

              <FormField
                label="Document Title"
                value={
                  form.title
                }
                onChange={(value) =>
                  setForm({
                    ...form,
                    title: value,
                  })
                }
                placeholder="Director Profile"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Department
                  </label>

                  <select
                    value={
                      form.departmentId
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        departmentId:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="">
                      Select department
                    </option>

                    {departments.map(
                      (
                        department
                      ) => (
                        <option
                          key={
                            department.id
                          }
                          value={
                            department.id
                          }
                        >
                          {
                            department.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Document Type
                  </label>

                  <select
                    value={
                      form.documentTypeId
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        documentTypeId:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="">
                      Select type
                    </option>

                    {documentTypes.map(
                      (type) => (
                        <option
                          key={
                            type.id
                          }
                          value={
                            type.id
                          }
                        >
                          {
                            type.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  label="Document Year"
                  type="number"
                  value={
                    form.year
                  }
                  onChange={(value) =>
                    setForm({
                      ...form,
                      year: value,
                    })
                  }
                  placeholder="2025"
                />

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Document Date
                  </label>

                  <input
                    type="date"
                    value={
                      form.documentDate
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        documentDate:
                          event.target
                            .value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Description
                </label>

                <textarea
                  rows={4}
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setForm({
                      ...form,
                      description:
                        event.target
                          .value,
                    })
                  }
                  placeholder="Additional record information..."
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={() =>
                    setShowMetadataModal(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                >
                  Register Metadata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================== */}
      {/* UPLOAD MODAL */}
      {/* =========================================================== */}

      {showUploadModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              if (!uploading) {
                closeUploadModal();
              }
            }
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-modal-title"
            aria-describedby="upload-modal-description"
            tabIndex={-1}
            className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
          >
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Document intake
                  </p>

                  <h2
                    id="upload-modal-title"
                    className="mt-1 text-xl font-bold"
                  >
                    Upload Document
                  </h2>

                  <p
                    id="upload-modal-description"
                    className="mt-1 text-sm text-slate-500"
                  >
                    Upload a PDF or DOCX document into the records system.
                  </p>
                </div>

                <button
                  ref={
                    modalCloseButtonRef
                  }
                  type="button"
                  onClick={
                    closeUploadModal
                  }
                  disabled={uploading}
                  aria-label="Close document upload dialog"
                  className="ml-4 rounded-lg p-2 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span aria-hidden="true">
                    ×
                  </span>
                </button>
              </div>
            </div>

            <form
              onSubmit={handleUpload}
              className="min-h-0 overflow-hidden p-6"
            >
              {!uploadedDocument ? (
                <>
                  <label
                    htmlFor="document-upload"
                    className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-slate-400 hover:bg-slate-100 focus-within:border-slate-500 focus-within:ring-2 focus-within:ring-slate-900 focus-within:ring-offset-2"
                  >
                    <div
                      aria-hidden="true"
                      className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-2xl text-white"
                    >
                      ↑
                    </div>

                    <div className="text-base font-semibold">
                      Choose a document
                    </div>

                    <div className="mt-2 text-sm text-slate-500">
                      PDF or DOCX
                    </div>

                    <div className="mt-1 text-xs text-slate-400">
                      Click to browse your computer
                    </div>

                    <input
                      id="document-upload"
                      type="file"
                      accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={
                        handleFileChange
                      }
                      className="sr-only"
                    />
                  </label>

                  {selectedFile && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <div
                          aria-hidden="true"
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-sm font-bold text-slate-700"
                        >
                          ▣
                        </div>

                        <div>
                          <div className="font-semibold text-slate-900">
                            {
                              selectedFile.name
                            }
                          </div>

                          <div className="mt-1 text-sm text-slate-500">
                            {formatFileSize(
                              selectedFile.size
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <div
                      role="alert"
                      className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                      {
                        uploadError
                      }
                    </div>
                  )}

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={
                        closeUploadModal
                      }
                      disabled={
                        uploading
                      }
                      className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={
                        !selectedFile ||
                        uploading
                      }
                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploading
                        ? "Uploading..."
                        : "Upload Document"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex max-h-[75vh] min-h-0 flex-col py-6">
                  <div className="shrink-0 text-center">
                    <div
                      aria-hidden="true"
                      className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-700"
                    >
                      ✓
                    </div>

                    <h3 className="mt-4 text-xl font-bold">
                      Document Uploaded
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      The document has been securely added to the system.
                    </p>
                  </div>

                  <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-2">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-5 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Uploaded Document
                        </p>

                        <div className="mt-1 flex items-center justify-between gap-3">
                          <h4 className="text-lg font-bold text-slate-900">
                            Document Details
                          </h4>

                          {uploadedDocument.status && (
                            <StatusBadge
                              status={String(
                                uploadedDocument.status
                              )}
                            />
                          )}
                        </div>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {uploadFieldEntries.map(
                          ([key, value]) => {
                            const isDocumentCode =
                              key ===
                              "document_code";

                            const isFilename =
                              key ===
                              "filename";

                            const isStatus =
                              key ===
                              "status";

                            return (
                              <div
                                key={key}
                                className="px-5 py-3.5"
                              >
                                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                      {formatUploadFieldLabel(
                                        key
                                      )}
                                    </p>
                                  </div>

                                  <div
                                    className={`min-w-0 text-sm sm:max-w-[65%] sm:text-right ${
                                      isDocumentCode
                                        ? "text-lg font-bold text-blue-600"
                                        : isFilename
                                          ? "font-semibold text-slate-900"
                                          : isStatus
                                            ? "font-semibold text-slate-700"
                                            : "text-slate-700"
                                    }`}
                                  >
                                    {isStatus ? (
                                      <StatusBadge
                                        status={String(
                                          value
                                        )}
                                      />
                                    ) : (
                                      <span
                                        className={
                                          typeof value ===
                                          "object"
                                            ? "whitespace-pre-wrap break-words font-mono text-xs"
                                            : "break-words"
                                        }
                                      >
                                        {formatUploadFieldValue(
                                          key,
                                          value
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 shrink-0 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs leading-5 text-amber-800">
                    <p>
                      <strong>
                        Next step:
                      </strong>{" "}
                      the document is currently unlinked. The intelligent
                      matching engine will compare its extracted information
                      against your pre-fed metadata records.
                    </p>
                  </div>

                  <div className="mt-4 flex shrink-0 justify-center">
                    <button
                      type="button"
                      onClick={
                        closeUploadModal
                      }
                      className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

/* =============================================================== */
/* NAV ITEM */
/* =============================================================== */

function NavItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      <span
        aria-hidden="true"
        className="w-5 text-center"
      >
        {icon}
      </span>

      {label}
    </button>
  );
}

/* =============================================================== */
/* WORKFLOW STEP */
/* =============================================================== */

function WorkflowStep({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-4">
      <div
        aria-hidden="true"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-bold text-slate-600"
      >
        {number}
      </div>

      <div>
        <p className="text-sm font-bold">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}

/* =============================================================== */
/* SUMMARY CARD */
/* =============================================================== */

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight">
        {value}
      </p>
    </div>
  );
}

/* =============================================================== */
/* STATUS BADGE */
/* =============================================================== */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized =
    status.toUpperCase();

  let classes =
    "bg-slate-100 text-slate-700";

  let label = status;

  if (
    normalized ===
    "AWAITING_DOCUMENT"
  ) {
    classes =
      "bg-amber-100 text-amber-800";

    label =
      "Awaiting Document";
  }

  if (
    normalized === "LINKED"
  ) {
    classes =
      "bg-emerald-100 text-emerald-800";

    label = "Linked";
  }

  if (
    normalized === "UNLINKED"
  ) {
    classes =
      "bg-slate-100 text-slate-700";

    label = "Unlinked";
  }

  if (
    normalized === "NEEDS_REVIEW" ||
    normalized === "REVIEW"
  ) {
    classes =
      "bg-orange-100 text-orange-800";

    label = "Needs Review";
  }

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${classes}`}
    >
      {label}
    </span>
  );
}

/* =============================================================== */
/* FORM FIELD */
/* =============================================================== */

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </div>
  );
}

/* =============================================================== */
/* SETTINGS CARD */
/* =============================================================== */

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-5">
        <h3 className="font-bold">
          {title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {children}
      </div>
    </section>
  );
}

/* =============================================================== */
/* SETTING ROW */
/* =============================================================== */

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-sm text-slate-600">
        {label}
      </span>

      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
        {value}
      </span>
    </div>
  );
}