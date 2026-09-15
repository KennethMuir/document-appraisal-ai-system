"use client";
import { Modals } from "@/components/modals/Modals";
import { Departments } from "@/components/departments/Departments";
import { Settings } from "@/components/settings/Settings";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  getCurrentUser,
  logoutUser,
} from "@/lib/api/auth";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartmentRequest,
} from "@/lib/api/departments";
import { getDashboard } from "@/lib/api/dashboard";
import { getDocumentTypes } from "@/lib/api/document-types";
import { getDocuments, getDocumentFile, reviewDocument, uploadDocument } from "@/lib/api/documents";
import { searchDocuments } from "@/lib/api/search";

import { createMetadata, getMetadata, importBulkMetadata, previewBulkMetadata } from "@/lib/api/metadata";
import { getUsers, updateUser } from "@/lib/api/users";

import { Search } from "@/components/search/Search";
import type {
  ChangeEvent,
  FormEvent,
  ReactNode,
} from "react";

import {
  formatDate,
  formatFileSize,
  formatUploadFieldLabel,
  formatUploadFieldValue,
} from "@/lib/utils/formatting";
const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

import type {
  AuthUser,
  UserManagementUser,
} from "@/types/auth";
import type {
  Statistics,
} from "@/types/dashboard";
import type {
  Department,
  DocumentType,
} from "@/types/departments";
import type {
  UploadedDocument,
  SearchResultDocument,
} from "@/types/documents";
import type {
  UploadedAppraisal,
} from "@/types/appraisal";
import type {
  AdditionalMetadataField,
  MetadataRecord,
} from "@/types/metadata";
import type {
  SearchResult,
} from "@/types/search";
import { NavItem } from "@/components/layout/NavItem";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { MetadataRegistry } from "@/components/metadata/MetadataRegistry";
import { Documents } from "@/components/documents/Documents";
import { Dashboard } from "@/components/dashboard/Dashboard";
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
  section: "",
  description: "",
  additionalMetadata: [] as AdditionalMetadataField[],
};

export default function Home() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [dashboardDocumentFilter, setDashboardDocumentFilter] =
    useState<"ALL" | "LINKED" | "UNLINKED" | "REVIEW">("ALL");

  const [dashboardMetadataFilter, setDashboardMetadataFilter] =
    useState<"ALL" | "AWAITING_DOCUMENT">("ALL");

  const [authUser, setAuthUser] =
    useState<AuthUser | null>(null);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [authError, setAuthError] =
    useState("");

  const canManageDocuments =
    authUser?.role === "ADMIN" ||
    authUser?.role === "APPRAISER";

  const canManageMetadata =
    authUser?.role === "ADMIN" ||
    authUser?.role === "APPRAISER";

  const canManageDepartments =
    authUser?.role === "ADMIN";
  const [statistics, setStatistics] =
    useState<Statistics | null>(null);
  const [
    userManagementUsers,
    setUserManagementUsers,
  ] = useState<UserManagementUser[]>([]);

  const [
    userManagementLoading,
    setUserManagementLoading,
  ] = useState(false);

  const [
    userManagementError,
    setUserManagementError,
  ] = useState("");

  const [
    updatingUserId,
    setUpdatingUserId,
  ] = useState<number | null>(null);

  const [metadata, setMetadata] =
    useState<MetadataRecord[]>([]);

  const [showBulkMetadataModal, setShowBulkMetadataModal] =
    useState(false);

  const [bulkMetadataFile, setBulkMetadataFile] =
    useState<File | null>(null);

  const [bulkMetadataPreview, setBulkMetadataPreview] =
    useState<{
      totalRows: number;
      rows: Array<Record<string, unknown>>;
      existingReferenceCodes: string[];
      canImport: boolean;
      truncated: boolean;
    } | null>(null);

  const [bulkMetadataError, setBulkMetadataError] =
    useState("");

  const [bulkMetadataLoading, setBulkMetadataLoading] =
    useState(false);

  const [bulkMetadataImporting, setBulkMetadataImporting] =
    useState(false);

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [departmentModalOpen, setDepartmentModalOpen] =
    useState(false);

  const [departmentEditingId, setDepartmentEditingId] =
    useState<number | null>(null);

  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const [departmentMutationError, setDepartmentMutationError] =
    useState("");

  const [departmentSaving, setDepartmentSaving] =
    useState(false);

  const [documentTypes, setDocumentTypes] =
    useState<DocumentType[]>([]);

  const refreshDepartments = async () => {
    const response = await getDepartments();

    const data =
      await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error ||
          "Unable to retrieve departments."
      );
    }

    setDepartments(
      Array.isArray(data.departments)
        ? data.departments
        : []
    );
  };

  const openAddDepartmentModal = () => {
    if (!canManageDepartments) {
      return
    }

    setDepartmentEditingId(null);

    setDepartmentForm({
      name: "",
      code: "",
      description: "",
    });

    setDepartmentMutationError("");
    setDepartmentModalOpen(true);
  };

  const openEditDepartmentModal = (
    department: Department
  ) => {
    if (!canManageDepartments) {
      return
    }

    setDepartmentEditingId(
      department.id
    );

    setDepartmentForm({
      name: department.name,
      code: department.code,
      description:
        department.description || "",
    });

    setDepartmentMutationError("");
    setDepartmentModalOpen(true);
  };

  const closeDepartmentModal = () => {
    if (departmentSaving) {
      return;
    }

    setDepartmentModalOpen(false);
    setDepartmentMutationError("");
  };

  const saveDepartment = async () => {
    if (!canManageDepartments) {
      return
    }

    const name =
      departmentForm.name.trim();

    const code =
      departmentForm.code
        .trim()
        .toUpperCase();

    const description =
      departmentForm.description.trim();

    if (!name || !code) {
      setDepartmentMutationError(
        "Department name and code are required."
      );

      return;
    }

    setDepartmentSaving(true);
    setDepartmentMutationError("");

    try {
      const response =
        departmentEditingId === null
          ? await createDepartment({
              name,
              code,
              description,
            })
          : await updateDepartment(
              departmentEditingId,
              {
                name,
                code,
                description,
              }
            );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to save department."
        );
      }

      await refreshDepartments();

      setDepartmentModalOpen(false);
      setDepartmentMutationError("");
    } catch (error) {
      setDepartmentMutationError(
        error instanceof Error
          ? error.message
          : "Unable to save department."
      );
    } finally {
      setDepartmentSaving(false);
    }
  };

  const deleteDepartment = async (
    department: Department
  ): Promise<boolean> => {
    if (!canManageDepartments) {
      return false
    }

    const confirmed =
      window.confirm(
        `Delete the "${department.name}" department? Existing metadata and documents will remain, but their department assignment will become unassigned.`
      );

    if (!confirmed) {
      return false;
    }

    setDepartmentMutationError("");

    try {
      const response = await deleteDepartmentRequest(department.id);

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Unable to delete department."
        );
      }

      if (
        selectedDepartmentId ===
        department.id
      ) {
        setSelectedDepartmentId(null);
      }

      await refreshDepartments();

      return true;
    } catch (error) {
      setDepartmentMutationError(
        error instanceof Error
          ? error.message
          : "Unable to delete department."
      );

      return false;
    }
  };
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

  const [uploadedAppraisal, setUploadedAppraisal] =
    useState<UploadedAppraisal | null>(null);
const [appraisalMetadataForm, setAppraisalMetadataForm] =
  useState({
    referenceCode: "",
    title: "",
    documentDate: "",
    year: "",
    personName: "",
    departmentId: "",
    documentTypeId: "",
    section: "",
    description: "",
  });

  const appraisalRequiredFieldsComplete =
    Boolean(
      appraisalMetadataForm.referenceCode.trim() &&
      appraisalMetadataForm.title.trim() &&
      appraisalMetadataForm.documentDate &&
      appraisalMetadataForm.year.trim() &&
      appraisalMetadataForm.personName.trim() &&
      appraisalMetadataForm.departmentId &&
      appraisalMetadataForm.documentTypeId &&
      appraisalMetadataForm.section.trim() &&
      appraisalMetadataForm.description.trim()
    );


  const [expandedAdditionalMetadata, setExpandedAdditionalMetadata] =
    useState<Set<string>>(new Set());
  const [appraisalAdditionalMetadata, setAppraisalAdditionalMetadata] =
    useState<AdditionalMetadataField[]>([]);

  const [
    appraisalCommittedAdditionalMetadata,
    setAppraisalCommittedAdditionalMetadata,
  ] = useState<AdditionalMetadataField[]>([]);

  const [reviewingDecision, setReviewingDecision] =
    useState(false);

  const [reviewError, setReviewError] =
    useState("");

  const [searchResults, setSearchResults] =
    useState<SearchResult[]>([]);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [searchError, setSearchError] =
    useState("");
  const [searchTerm, setSearchTerm] =
    useState("");

const [selectedDepartmentId, setSelectedDepartmentId] =
  useState<number | null>(null);

const openDepartmentRecords = (
  department: Department
) => {
  setSelectedDepartmentId(department.id);
  setSearchTerm("");
  setActivePage("Metadata Registry");
};

  const appContentRef =
    useRef<HTMLDivElement | null>(null);

  const modalRef =
    useRef<HTMLDivElement | null>(null);

  const modalCloseButtonRef =
    useRef<HTMLButtonElement | null>(null);

  const previousFocusedElementRef =
    useRef<HTMLElement | null>(null);

  const previousBodyOverflowRef =
    useRef("");

  const bodyScrollLockActiveRef =
    useRef(false);

  const uploadingRef =
    useRef(false);

  const [form, setForm] =
    useState(EMPTY_FORM);

  /*
   * Keep the upload state available to the modal keyboard handler
   * without making the focus-management effect restart during upload.
   */
  useEffect(() => {
    uploadingRef.current = uploading;
  }, [uploading]);

  const getStatValue = (
    key: (typeof statCards)[number]["key"]
  ): string | number => {
    if (!statistics) return "—";

    return statistics[key] ?? "—";
  };

  const handleDashboardStatCardClick = (
    key: (typeof statCards)[number]["key"]
  ) => {
    setSelectedDepartmentId(null);
    setSearchTerm("");

    switch (key) {
      case "documents":
        setDashboardDocumentFilter("ALL");
        setActivePage("Documents");
        break;

      case "metadata":
        setDashboardMetadataFilter("ALL");
        setActivePage("Metadata Registry");
        break;

      case "awaiting":
        setDashboardMetadataFilter("AWAITING_DOCUMENT");
        setActivePage("Metadata Registry");
        break;

      case "review":
        setDashboardDocumentFilter("REVIEW");
        setActivePage("Documents");
        break;

      case "linked":
        setDashboardDocumentFilter("LINKED");
        setActivePage("Documents");
        break;

      case "unlinked":
        setDashboardDocumentFilter("UNLINKED");
        setActivePage("Documents");
        break;
    }
  };


  /*
   * =============================================================
   * MODAL CLOSE HELPERS
   * =============================================================
   */

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
        getDashboard(),
        getMetadata(),
        getDepartments(),
        getDocumentTypes(),
        getDocuments(),
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
    let cancelled = false;

    const verifySession = async () => {
      try {
        setAuthError("");

        const response = await getCurrentUser();

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (
          !response.ok ||
          !data.success ||
          !data.authenticated ||
          !data.user
        ) {
          setAuthUser(null);
          setAuthError(
            data.error ||
              "Your session has expired. Please sign in again."
          );
          return;
        }

        setAuthUser(data.user);
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Session verification failed:",
          error
        );

        setAuthUser(null);
        setAuthError(
          "Unable to verify your session. Please sign in again."
        );
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    void verifySession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authUser) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError("");
      return;
    }

    const query = searchTerm.trim();

    if (!query) {
      setSearchResults([]);
      setSearchLoading(false);
      setSearchError("");
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        setSearchLoading(true);
        setSearchError("");

        const response = await searchDocuments(query);

        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.error ||
              "Unable to search records."
          );
        }

        setSearchResults(
          Array.isArray(data.results)
            ? data.results
            : []
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "Search request failed:",
          error
        );

        setSearchResults([]);
        setSearchError(
          error instanceof Error
            ? error.message
            : "Unable to search records."
        );
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [searchTerm, authLoading, authUser]);

  const closeMetadataModal = () => {
    setShowMetadataModal(false);
  };

  const closeBulkMetadataModal = () => {
    if (bulkMetadataLoading || bulkMetadataImporting) {
      return;
    }

    setShowBulkMetadataModal(false);
    setBulkMetadataFile(null);
    setBulkMetadataPreview(null);
    setBulkMetadataError("");
  };

  const downloadBulkMetadataTemplate = () => {
    const csv = [
      "reference_code,person_name,title,department,document_type,year,document_date,section,description,contract_number,employee_number,expiry_date",
      "DOC-EXAMPLE-001,Jane Doe,Example Document,Finance,Contract,2026,2026-01-15,Section A,Example metadata record,CNT-2026-001,EMP-00001,2028-06-30"
    ].join("\\r\\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "metadata-upload-template.csv";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleBulkMetadataPreview = async () => {
    if (!canManageMetadata || !bulkMetadataFile) {
      return;
    }

    setBulkMetadataLoading(true);
    setBulkMetadataError("");
    setBulkMetadataPreview(null);

    try {
      const formData = new FormData();
      formData.append("file", bulkMetadataFile);

      const response = await await previewBulkMetadata(formData);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          Array.isArray(data.errors)
            ? data.errors.join("\\n")
            : data.error || "Unable to preview bulk metadata."
        );
      }

      setBulkMetadataPreview({
        totalRows: Number(data.totalRows || 0),
        rows: Array.isArray(data.rows) ? data.rows : [],
        existingReferenceCodes:
          Array.isArray(data.existingReferenceCodes)
            ? data.existingReferenceCodes
            : [],
        canImport: data.canImport !== false,
        truncated: data.truncated === true,
      });
    } catch (error) {
      setBulkMetadataError(
        error instanceof Error
          ? error.message
          : "Unable to preview bulk metadata."
      );
    } finally {
      setBulkMetadataLoading(false);
    }
  };

  const handleBulkMetadataImport = async () => {
    if (!canManageMetadata || !bulkMetadataFile || !bulkMetadataPreview?.canImport) {
      return;
    }

    setBulkMetadataImporting(true);
    setBulkMetadataError("");

    try {
      const formData = new FormData();
      formData.append("file", bulkMetadataFile);

      const response = await await importBulkMetadata(formData);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          Array.isArray(data.errors)
            ? data.errors.join("\\n")
            : data.error || "Unable to import metadata."
        );
      }

      closeBulkMetadataModal();
      await loadData();
      window.alert(
        `${Number(data.importedCount || data.count || bulkMetadataPreview.totalRows)} metadata records imported successfully.`
      );
    } catch (error) {
      setBulkMetadataError(
        error instanceof Error
          ? error.message
          : "Unable to import metadata."
      );
    } finally {
      setBulkMetadataImporting(false);
    }
  };

  const closeUploadModal = () => {
    if (uploading) {
      return;
    }

    setShowUploadModal(false);
    setSelectedFile(null);
    setUploadError("");
    setUploadedDocument(null);
    setUploadedAppraisal(null);
    setReviewingDecision(false);
    setReviewError("");
  };

  /*
   * =============================================================
   * METADATA SUBMISSION
   * =============================================================
   */

  const handleMetadataSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    if (!canManageMetadata) {
      return
    }

    event.preventDefault();

    try {
      const response = await createMetadata({
          referenceCode:
            form.referenceCode.trim(),
          personName:
            form.personName.trim() ||
            null,
          title:
            form.title.trim() ||
            null,
          departmentId:
            form.departmentId ||
            null,
          documentTypeId:
            form.documentTypeId ||
            null,
          year:
            form.year ||
            null,
          documentDate:
            form.documentDate ||
            null,
          section:
            form.section.trim() ||
            null,
          description:
            form.description.trim() ||
            null,
        })

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

      closeMetadataModal();
      setForm({
        ...EMPTY_FORM,
      });

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
      event.target.files?.[0] ??
      null;

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
      !allowedTypes.includes(
        file.type
      ) &&
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
    if (!canManageDocuments) {
      return
    }

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
      setUploadedAppraisal(null);
      setReviewingDecision(false);
      setReviewError("");

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response =
        await uploadDocument(selectedFile);

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
        typeof data.document !==
          "object"
      ) {
        throw new Error(
          "Document uploaded, but the API returned an invalid document response."
        );
      }

      setUploadedDocument(
        data.document as UploadedDocument
      );

      if (
        data.appraisal &&
        typeof data.appraisal === "object"
      ) {
        const appraisal =
          data.appraisal as UploadedAppraisal;

        setUploadedAppraisal(appraisal);

        const metadata =
          appraisal.metadata ?? null;

        setAppraisalMetadataForm({
          referenceCode:
            metadata?.reference_code ??
            data.metadata?.reference_code ??
            "",
          title:
            metadata?.title ??
            data.metadata?.title ??
            "",
          documentDate:
            metadata?.document_date ??
            data.metadata?.document_date ??
            "",
          year:
            metadata?.year != null
              ? String(metadata.year)
              : data.metadata?.year != null
                ? String(data.metadata.year)
                : "",
          personName:
            metadata?.person_name ??
            data.metadata?.person_name ??
            "",
          departmentId:
            metadata?.department_id != null
              ? String(metadata.department_id)
              : "",
          documentTypeId:
            metadata?.document_type_id != null
              ? String(metadata.document_type_id)
              : "",
          section:
            metadata?.section ??
            data.metadata?.section ??
            "",
          description:
            metadata?.description ??
            data.metadata?.description ??
            "",
        });
        setAppraisalCommittedAdditionalMetadata(
          Object.entries(
            metadata?.additional_metadata ??
              data.metadata?.additional_metadata ??
              {}
          ).map(([key, value]) => ({
            key,
            value:
              value === null || value === undefined
                ? ""
                : String(value),
          }))
        );
        setAppraisalAdditionalMetadata([]);
      } else {
        setUploadedAppraisal(null);
      }

      setReviewError("");

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
   * APPRAISAL REVIEW
   * =============================================================
   */


  const handleOpenDocument = async (
  documentId: string | number
) => {
  const numericDocumentId =
    Number(documentId);

  if (
    !Number.isInteger(numericDocumentId) ||
    numericDocumentId <= 0
  ) {
    return;
  }

  const documentWindow =
    window.open("", "_blank");

  if (!documentWindow) {
    setReviewError(
      "Unable to open the document. Please allow pop-ups for this site and try again."
    );
    return;
  }

  documentWindow.document.title =
    "Opening document...";

  try {
    setReviewError("");

    const response = await getDocumentFile(numericDocumentId);

    if (!response.ok) {
      let errorMessage =
        "Unable to open the document.";

      try {
        const data = await response.json();

        if (
          data &&
          typeof data.error === "string" &&
          data.error.trim()
        ) {
          errorMessage = data.error;
        }
      } catch {
        // Non-JSON error response.
      }

      throw new Error(errorMessage);
    }

    const blob =
      await response.blob();

    const objectUrl =
      URL.createObjectURL(blob);

    documentWindow.location.href =
      objectUrl;

    window.setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 60_000);
  } catch (error) {
    documentWindow.close();

    console.error(
      "Document opening failed:",
      error
    );

    setReviewError(
      error instanceof Error
        ? error.message
        : "Unable to open the document."
    );
  }
};
const handleAppraisalReview = async (
  decision: "APPROVE" | "REJECT"
) => {
    if (!canManageDocuments) {
      return
    }

  if (!uploadedDocument?.id || !uploadedAppraisal) return;

  if (
    decision === "APPROVE" &&
    !uploadedAppraisal.metadataRecordId
  ) {
    setReviewError(
      "There is no metadata record available to approve."
    );
    return;
  }

  try {
    setReviewingDecision(true);
    setReviewError("");

    const response = await reviewDocument(
      Number(uploadedDocument.id),
      {
        decision,
        metadataRecordId:
          uploadedAppraisal.metadataRecordId,
        metadata: {
          referenceCode:
            appraisalMetadataForm.referenceCode.trim() || null,
          title:
            appraisalMetadataForm.title.trim() || null,
          documentDate:
            appraisalMetadataForm.documentDate || null,
          year:
            appraisalMetadataForm.year.trim() || null,
          personName:
            appraisalMetadataForm.personName.trim() || null,
          departmentId:
            appraisalMetadataForm.departmentId || null,
          documentTypeId:
            appraisalMetadataForm.documentTypeId || null,
          section:
            appraisalMetadataForm.section.trim() || null,
          description:
            appraisalMetadataForm.description.trim() || null,
          additionalMetadata: Object.fromEntries(
            [
              ...appraisalCommittedAdditionalMetadata,
              ...appraisalAdditionalMetadata,
            ]
              .map((field) => [
                field.key.trim(),
                field.value.trim(),
              ] as const)
              .filter(([key]) => Boolean(key))
          ),
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error ||
          data.message ||
          data.details ||
          "Unable to process the appraisal decision."
      );
    }

    if (data.document) {
      setUploadedDocument(data.document);
    }

    await loadData();

    if (decision === "REJECT" && data.metadata) {
      setUploadedAppraisal((current) => ({
        ...(current || {
          matchType: "NO_MATCH",
          confidence: 0,
          metadataRecordId: null,
          matchingFields: [],
          conflictingFields: [],
          decision: "",
        }),
        metadataRecordId: Number(data.metadata.id),
        decision: "LINKED",
        matchType: "NO_MATCH",
        confidence: 100,
        matchingFields: [
          "Metadata created from reviewed document",
        ],
        conflictingFields: [],
        match: data.match
          ? {
              ...data.match,
              metadata_record_id: data.metadata.id,
              match_type: "HUMAN_CREATED_METADATA",
              confidence: 100,
              decision: "LINKED",
            }
          : undefined,
      }));

      /*
       * The backend may generate a new unique reference
       * code when the rejected metadata reference already
       * exists. Reflect that new reference in the editable
       * appraisal form while preserving every other field.
       */
      setAppraisalMetadataForm((current) => ({
        ...current,
        referenceCode:
          data.metadata?.reference_code ??
          current.referenceCode,
      }));

      setReviewError("");
      return;
    }

    if (decision === "APPROVE") {
      setUploadedAppraisal((current) =>
        current
          ? {
              ...current,
              decision: "LINKED",
              metadataRecordId:
                data.metadata?.id ??
                current.metadataRecordId,
            }
          : current
      );

      setReviewError("");
    }
  } catch (error) {
    setReviewError(
      error instanceof Error
        ? error.message
        : "Unable to process the appraisal decision."
    );
  } finally {
    setReviewingDecision(false);
  }
};

  const loadUserManagementUsers =
    async () => {
      if (authUser?.role !== "ADMIN") {
        return;
      }

      try {
        setUserManagementLoading(true);
        setUserManagementError("");

        const response = await getUsers();

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Unable to retrieve users."
          );
        }

        setUserManagementUsers(
          Array.isArray(data.users)
            ? data.users
            : []
        );
      } catch (error) {
        console.error(
          "User management load failed:",
          error
        );

        setUserManagementUsers([]);

        setUserManagementError(
          error instanceof Error
            ? error.message
            : "Unable to retrieve users."
        );
      } finally {
        setUserManagementLoading(false);
      }
    };

  const updateManagedUser =
    async (
      userId: number,
      changes: {
        role?: "ADMIN" | "APPRAISER" | "VIEWER";
        isActive?: boolean;
      }
    ) => {
      if (authUser?.role !== "ADMIN") {
        return;
      }

      try {
        setUpdatingUserId(userId);
        setUserManagementError("");

        const response = await updateUser(userId, changes);

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Unable to update user."
          );
        }

        setUserManagementUsers(
          (currentUsers) =>
            currentUsers.map(
              (user) =>
                user.id === userId
                  ? data.user
                  : user
            )
        );
      } catch (error) {
        console.error(
          "User update failed:",
          error
        );

        setUserManagementError(
          error instanceof Error
            ? error.message
            : "Unable to update user."
        );
      } finally {
        setUpdatingUserId(null);
      }
    };

  useEffect(() => {
    if (
      activePage === "Settings" &&
      authUser?.role === "ADMIN"
    ) {
      void loadUserManagementUsers();
    }
  }, [
    activePage,
    authUser?.role,
  ]);
  const logout = async () => {
    if (loggingOut) {
      return;
    }

    try {
      setLoggingOut(true);

      await logoutUser();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      window.location.href = "/login";
    }
  };

  const uploadFieldEntries =
    uploadedDocument
      ? Object.entries(
          uploadedDocument
        )
      : [];

  const matchedMetadata =
    uploadedAppraisal?.metadataRecordId
      ? metadata.find(
          (record) =>
            Number(record.id) ===
            Number(
              uploadedAppraisal.metadataRecordId
            )
        ) ?? null
      : null;

  const appraisalDecisionLabel =
    uploadedAppraisal?.decision ===
    "LINKED"
      ? "LINKED"
      : uploadedAppraisal?.decision ===
        "NEW_METADATA_CREATED"
        ? "NEW METADATA CREATED & LINKED"
        : uploadedAppraisal?.decision ===
          "REJECT"
          ? "REJECTED"
          : "REVIEW REQUIRED";

  const appraisalIsLinked =
    uploadedAppraisal?.decision ===
    "LINKED";

  const filteredMetadata =
    metadata.filter((record: MetadataRecord) => {
      if (
        dashboardMetadataFilter !== "ALL" &&
        record.status !== dashboardMetadataFilter
      ) {
        return false;
      }

      if (selectedDepartmentId !== null) {
        const department =
          departments.find(
            (item) =>
              item.id ===
              selectedDepartmentId
          );

        if (
          !department ||
          record.department_name !==
            department.name
        ) {
          return false;
        }
      }

      const query =
        searchTerm.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return [
        record.reference_code,
        record.title,
        record.person_name,
        record.description,
        record.section,
        record.department_name,
        record.document_type_name,
        record.status,
        record.linked_document_code,
        record.linked_filename,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query)
        );
    });
const selectedDepartment =
  selectedDepartmentId !== null
    ? departments.find(
        (department) =>
          department.id ===
          selectedDepartmentId
      ) ?? null
    : null;

const dashboardFilteredDocuments =
  dashboardDocumentFilter === "ALL"
    ? documents
    : documents.filter((document) => {
        const status = String(
          document.status ?? ""
        ).toUpperCase();

        if (dashboardDocumentFilter === "LINKED") {
          return status === "LINKED";
        }

        if (dashboardDocumentFilter === "UNLINKED") {
          return status === "UNLINKED";
        }

        return (
          status === "REVIEW_REQUIRED" ||
          status === "NEEDS_REVIEW" ||
          status === "REVIEW"
        );
      });

const selectedDepartmentDocuments =
  selectedDepartmentId !== null
    ? documents.filter((document) => {
        const documentDepartmentId =
          document.department_id;

        return (
          documentDepartmentId !==
            undefined &&
          documentDepartmentId !==
            null &&
          Number(documentDepartmentId) ===
            selectedDepartmentId
        );
      })
    : [];

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] text-slate-900">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
          <p className="text-sm font-semibold">
            Verifying your session...
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Please wait.
          </p>
        </div>
      <Modals
        canManageDepartments={canManageDepartments}
        canManageMetadata={canManageMetadata}
        canManageDocuments={canManageDocuments}

        departmentModalOpen={departmentModalOpen}
        departmentEditingId={departmentEditingId}
        departmentForm={departmentForm}
        departmentMutationError={departmentMutationError}
        departmentSaving={departmentSaving}
        departments={departments}

        setDepartmentForm={setDepartmentForm}
        setDepartmentModalOpen={setDepartmentModalOpen}
        setDepartmentMutationError={setDepartmentMutationError}
        setDepartmentSaving={setDepartmentSaving}

        closeDepartmentModal={closeDepartmentModal}
        saveDepartment={saveDepartment}
        deleteDepartment={deleteDepartment}

        showBulkMetadataModal={showBulkMetadataModal}
        bulkMetadataFile={bulkMetadataFile}
        bulkMetadataPreview={bulkMetadataPreview}
        bulkMetadataError={bulkMetadataError}
        bulkMetadataLoading={bulkMetadataLoading}
        bulkMetadataImporting={bulkMetadataImporting}

        setBulkMetadataFile={setBulkMetadataFile}
        setBulkMetadataPreview={setBulkMetadataPreview}
        setBulkMetadataError={setBulkMetadataError}

        closeBulkMetadataModal={closeBulkMetadataModal}
        handleBulkMetadataPreview={handleBulkMetadataPreview}
        handleBulkMetadataImport={handleBulkMetadataImport}
        downloadBulkMetadataTemplate={downloadBulkMetadataTemplate}

        showMetadataModal={showMetadataModal}
        form={form}
        documentTypes={documentTypes}

        setForm={setForm}
        closeMetadataModal={closeMetadataModal}
        handleMetadataSubmit={handleMetadataSubmit}

        showUploadModal={showUploadModal}
        selectedFile={selectedFile}
        uploading={uploading}
        uploadError={uploadError}
        uploadedDocument={uploadedDocument}
        uploadedAppraisal={uploadedAppraisal}

        uploadFieldEntries={uploadFieldEntries}

        appraisalMetadataForm={appraisalMetadataForm}
        appraisalAdditionalMetadata={appraisalAdditionalMetadata}
        appraisalCommittedAdditionalMetadata={appraisalCommittedAdditionalMetadata}
        appraisalRequiredFieldsComplete={appraisalRequiredFieldsComplete}
        appraisalDecisionLabel={appraisalDecisionLabel}
        appraisalIsLinked={appraisalIsLinked}
        matchedMetadata={matchedMetadata}
        reviewingDecision={reviewingDecision}
        reviewError={reviewError}

        setAppraisalMetadataForm={setAppraisalMetadataForm}
        setAppraisalAdditionalMetadata={setAppraisalAdditionalMetadata}
        setAppraisalCommittedAdditionalMetadata={setAppraisalCommittedAdditionalMetadata}

        handleFileChange={handleFileChange}
        handleUpload={handleUpload}
        handleAppraisalReview={handleAppraisalReview}
        closeUploadModal={closeUploadModal}

        modalRef={modalRef}
        modalCloseButtonRef={modalCloseButtonRef}

        StatusBadge={StatusBadge}
        FormField={FormField}
        formatFileSize={formatFileSize}
        formatUploadFieldLabel={formatUploadFieldLabel}
        formatUploadFieldValue={formatUploadFieldValue}
      />
      </main>
    );
  }

  if (!authUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] text-slate-900">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
          <p className="text-sm font-semibold">
            {authError || "Redirecting to sign in..."}
          </p>

          {authError ? (
            <button
              type="button"
              onClick={() => {
                window.location.href = "/login";
              }}
              className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Go to sign in
            </button>
          ) : null}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-900">
      <div
        ref={appContentRef}
        className="flex min-h-screen"
      >
        {/* ========================================================= */}
        {/* SIDEBAR */}
        {/* ========================================================= */}

        <Sidebar
              activePage={activePage}
              setActivePage={setActivePage}
              canManageDocuments={canManageDocuments}
              setShowUploadModal={setShowUploadModal}
              authUser={authUser}
              logout={logout}
              loggingOut={loggingOut}
/>

        {/* ========================================================= */}
        {/* MAIN */}
        {/* ========================================================= */}

        <section className="flex-1">
          <TopBar
            activePage={activePage}
            setActivePage={setActivePage}
            canManageDocuments={canManageDocuments}
            setShowUploadModal={setShowUploadModal}
/>

          {/* ======================================================= */}
          {/* CONTENT */}
          {/* ======================================================= */}

          <div className="px-6 py-8 lg:px-10">
            {/* ===================================================== */}
            {/* DASHBOARD */}
            {/* ===================================================== */}

            <Dashboard
              statistics={statistics}
              departments={departments}
              documents={documents}
              metadata={metadata}
              statCards={statCards}
              dashboardDocumentFilter={dashboardDocumentFilter}
              dashboardMetadataFilter={dashboardMetadataFilter}
              canManageMetadata={canManageMetadata}
              setDashboardDocumentFilter={setDashboardDocumentFilter}
              setDashboardMetadataFilter={setDashboardMetadataFilter}
              setShowMetadataModal={setShowMetadataModal}
              setActivePage={setActivePage}
              handleDashboardStatCardClick={handleDashboardStatCardClick}
              openDepartmentRecords={openDepartmentRecords}
              getStatValue={getStatValue}
/>
{activePage ===
              "Metadata Registry" && (
              <MetadataRegistry
                 metadata={metadata}
                 departments={departments}
                 documents={documents}
                 selectedDepartment={selectedDepartment}
                 selectedDepartmentDocuments={selectedDepartmentDocuments}
                 filteredMetadata={filteredMetadata}
                 searchTerm={searchTerm}
                 canManageMetadata={canManageMetadata}
                 loading={loading}
                 expandedAdditionalMetadata={expandedAdditionalMetadata}
                 setExpandedAdditionalMetadata={setExpandedAdditionalMetadata}
                 setSearchTerm={setSearchTerm}
                 setSelectedDepartmentId={setSelectedDepartmentId}
                 setShowMetadataModal={setShowMetadataModal}
                 setShowBulkMetadataModal={setShowBulkMetadataModal}
                 SummaryCard={SummaryCard}
                 StatusBadge={StatusBadge}
               />
            )}

            {/* ===================================================== */}
            {/* DOCUMENTS */}
            {/* ===================================================== */}

            {activePage ===
              "Documents" && (
              <Documents
                documents={documents}
                dashboardFilteredDocuments={
                  dashboardFilteredDocuments
                }
                metadata={metadata}
                dashboardDocumentFilter={
                  dashboardDocumentFilter
                }
                canManageDocuments={
                  canManageDocuments
                }
                loading={loading}
                setShowUploadModal={
                  setShowUploadModal
                }
                setReviewError={
                  setReviewError
                }
                handleOpenDocument={
                  handleOpenDocument
                }
                formatFileSize={
                  formatFileSize
                }
                StatusBadge={
                  StatusBadge
                }
              />
            )}

            {/* ===================================================== */}
            {/* SEARCH */}
            {/* ===================================================== */}
                        <Search
              searchLoading={searchLoading}
              searchError={searchError}
              searchResults={searchResults}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              departments={departments}
              documents={documents}
              metadata={metadata}
              StatusBadge={StatusBadge}
              handleOpenDocument={handleOpenDocument}
            />




            {activePage === "Departments" && (
        <Departments
          departments={departments}
          canManageDepartments={canManageDepartments}
          departmentModalOpen={departmentModalOpen}
          departmentMutationError={departmentMutationError}
          openAddDepartmentModal={openAddDepartmentModal}
          openEditDepartmentModal={openEditDepartmentModal}
          openDepartmentRecords={openDepartmentRecords}
        />      )}

                        {activePage === "Settings" && (
              <Settings
                authUser={authUser}
                userManagementUsers={userManagementUsers}
                userManagementLoading={userManagementLoading}
                userManagementError={userManagementError}
                updatingUserId={updatingUserId}
                updateManagedUser={updateManagedUser}
              />
            )}

          </div>
        </section>
      </div>

      {/* =========================================================== */}
            {/* =========================================================== */}
      {/* DEPARTMENT MODAL */}
      {/* =========================================================== */}

{/* METADATA MODAL */}
      {/* =========================================================== */}

      {/* BULK METADATA UPLOAD */}


      {/* =========================================================== */}
      {/* UPLOAD MODAL */}
      {/* =========================================================== */}

    </main>
  );
}

/* =============================================================== */
/* NAV ITEM */
/* =============================================================== */

/* =============================================================== */
/* WORKFLOW STEP */
/* =======    {text}
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
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  id: string;
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
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold"
      >
        {label}
      </label>

      <input
        id={id}
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
















































