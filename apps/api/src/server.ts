import "dotenv/config";

import cors from "cors";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { Pool } from "pg";

const app = express();
const PORT = Number(process.env.PORT || 4000);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

app.use(cors());
app.use(express.json());

const storageRoot = path.resolve(
  process.cwd(),
  "..",
  "..",
  "storage",
  "documents"
);

fs.mkdirSync(storageRoot, { recursive: true });

const upload = multer({
  dest: path.resolve(
    process.cwd(),
    "..",
    "..",
    "storage",
    "temporary"
  ),
});

app.get("/api/health", async (_req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS database_time");

    res.json({
      success: true,
      service: "Document Appraisal AI API",
      status: "online",
      database: "connected",
      databaseTime: result.rows[0].database_time,
    });
  } catch (error) {
    console.error("Health check failed:", error);

    res.status(500).json({
      success: false,
      service: "Document Appraisal AI API",
      status: "degraded",
      database: "disconnected",
    });
  }
});

app.get("/api/dashboard", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM documents) AS documents,
        (SELECT COUNT(*) FROM metadata_records) AS metadata,
        (SELECT COUNT(*) FROM departments) AS departments,
        (SELECT COUNT(*) FROM documents WHERE metadata_record_id IS NOT NULL) AS linked,
        (SELECT COUNT(*) FROM metadata_records WHERE status = 'AWAITING_DOCUMENT') AS awaiting,
        (SELECT COUNT(*) FROM documents WHERE status = 'REVIEW_REQUIRED') AS review,
        (SELECT COUNT(*) FROM documents WHERE metadata_record_id IS NULL) AS unlinked
    `);

    res.json({
      success: true,
      dashboard: result.rows[0],
    });
  } catch (error) {
    console.error("Dashboard query failed:", error);

    res.status(500).json({
      success: false,
      error: "Unable to retrieve dashboard statistics",
    });
  }
});

app.get("/api/departments", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        code,
        description
      FROM departments
      ORDER BY name
    `);

    res.json({
      success: true,
      departments: result.rows,
    });
  } catch (error) {
    console.error("Departments query failed:", error);

    res.status(500).json({
      success: false,
      error: "Unable to retrieve departments",
    });
  }
});

app.get("/api/document-types", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        description
      FROM document_types
      ORDER BY name
    `);

    res.json({
      success: true,
      documentTypes: result.rows,
    });
  } catch (error) {
    console.error("Document types query failed:", error);

    res.status(500).json({
      success: false,
      error: "Unable to retrieve document types",
    });
  }
});

app.get("/api/metadata", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        mr.id,
        mr.reference_code,
        mr.title,
        mr.document_date,
        mr.year,
        mr.person_name,
        mr.description,
        mr.status,
        mr.created_at,
        mr.updated_at,

        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code,

        dt.id AS document_type_id,
        dt.name AS document_type_name,

        doc.id AS linked_document_id,
        doc.document_code AS linked_document_code,
        doc.filename AS linked_filename,
        doc.status AS linked_document_status

      FROM metadata_records mr

      LEFT JOIN departments d
        ON d.id = mr.department_id

      LEFT JOIN document_types dt
        ON dt.id = mr.document_type_id

      LEFT JOIN documents doc
        ON doc.metadata_record_id = mr.id

      ORDER BY mr.created_at DESC
    `);

    res.json({
      success: true,
      metadata: result.rows,
    });
  } catch (error) {
    console.error("Metadata query failed:", error);

    res.status(500).json({
      success: false,
      error: "Unable to retrieve metadata records",
    });
  }
});

app.post("/api/metadata", async (req, res) => {
  const {
    referenceCode,
    title,
    personName,
    departmentId,
    documentTypeId,
    year,
    documentDate,
    description,
  } = req.body;

  if (!referenceCode || !String(referenceCode).trim()) {
    return res.status(400).json({
      success: false,
      error: "Reference code is required",
    });
  }

  try {
    const duplicate = await pool.query(
      `
      SELECT id
      FROM metadata_records
      WHERE LOWER(reference_code) = LOWER($1)
      LIMIT 1
      `,
      [String(referenceCode).trim()]
    );

    if (duplicate.rowCount && duplicate.rowCount > 0) {
      return res.status(409).json({
        success: false,
        error: "A metadata record with this reference code already exists",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO metadata_records (
        reference_code,
        title,
        person_name,
        department_id,
        document_type_id,
        year,
        document_date,
        description,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        'AWAITING_DOCUMENT'
      )
      RETURNING
        id,
        reference_code,
        title,
        person_name,
        department_id,
        document_type_id,
        year,
        document_date,
        description,
        status,
        created_at,
        updated_at
      `,
      [
        String(referenceCode).trim(),
        title || null,
        personName || null,
        departmentId ? Number(departmentId) : null,
        documentTypeId ? Number(documentTypeId) : null,
        year ? Number(year) : null,
        documentDate || null,
        description || null,
      ]
    );

    res.status(201).json({
      success: true,
      metadata: result.rows[0],
    });
  } catch (error: any) {
    console.error("Metadata creation failed:", error);

    res.status(500).json({
      success: false,
      error: "Unable to create metadata record",
      details:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
});

app.get("/api/documents", async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        doc.id,
        doc.document_code,
        doc.filename,
        doc.title,
        doc.document_date,
        doc.upload_date,
        doc.year,
        doc.person_name,
        doc.file_type,
        doc.file_size,
        doc.status,

        doc.metadata_record_id,

        mr.reference_code,
        mr.status AS metadata_status,

        d.id AS department_id,
        d.name AS department_name,
        d.code AS department_code,

        dt.id AS document_type_id,
        dt.name AS document_type_name

      FROM documents doc

      LEFT JOIN metadata_records mr
        ON mr.id = doc.metadata_record_id

      LEFT JOIN departments d
        ON d.id = doc.department_id

      LEFT JOIN document_types dt
        ON dt.id = doc.document_type_id

      ORDER BY doc.upload_date DESC
    `);

    res.json({
      success: true,
      documents: result.rows,
    });
  } catch (error) {
    console.error("Documents query failed:", error);

    res.status(500).json({
      success: false,
      error: "Unable to retrieve documents",
    });
  }
});

app.post("/api/documents/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "A document file is required",
    });
  }

  try {
    const originalName = req.file.originalname;
    const extension = path.extname(originalName).toLowerCase();

    const allowedExtensions = [".pdf", ".docx"];

    if (!allowedExtensions.includes(extension)) {
      fs.unlinkSync(req.file.path);

      return res.status(400).json({
        success: false,
        error: "Only PDF and DOCX files are currently supported",
      });
    }

    const lock = await pool.query(
      "SELECT pg_advisory_xact_lock(782341)"
    );

    void lock;

    const codeResult = await pool.query(`
      SELECT COALESCE(
        MAX(
          CASE
            WHEN document_code ~ '^DOC-[0-9]+$'
            THEN CAST(SUBSTRING(document_code FROM 5) AS BIGINT)
            ELSE 0
          END
        ),
        0
      ) + 1 AS next_number
      FROM documents
    `);

    const documentCode = `DOC-${codeResult.rows[0].next_number}`;

    const targetPath = path.join(
      storageRoot,
      `${documentCode}${extension}`
    );

    fs.renameSync(req.file.path, targetPath);

    const result = await pool.query(
      `
      INSERT INTO documents (
        document_code,
        filename,
        file_type,
        file_size,
        status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'UNLINKED'
      )
      RETURNING *
      `,
      [
        documentCode,
        originalName,
        extension.replace(".", "").toUpperCase(),
        req.file.size,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document: result.rows[0],
    });
  } catch (error) {
    console.error("Document upload failed:", error);

    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: "Unable to upload document",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Document Appraisal AI API running on http://localhost:${PORT}`);
});
