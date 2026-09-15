"use client";


import type { Department } from "@/types/departments";

type DepartmentsProps = {
  departments: Department[];
  canManageDepartments: boolean;
  departmentModalOpen: boolean;
  departmentMutationError: string;
  openAddDepartmentModal: () => void;
  openEditDepartmentModal: (
    department: Department
  ) => void;
  openDepartmentRecords: (
    department: Department
  ) => void;
};

export function Departments({
  departments,
  canManageDepartments,
  departmentModalOpen,
  departmentMutationError,
  openAddDepartmentModal,
  openEditDepartmentModal,
  openDepartmentRecords,
}: DepartmentsProps) {
  return (
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

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {canManageDepartments && (
<button
                      type="button"
                      onClick={openAddDepartmentModal}
                      className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                    >
                      + Add Department
                    </button>
                    )}

                    {departmentMutationError &&
                      !departmentModalOpen && (
                        <p
                          role="alert"
                          className="text-sm font-medium text-red-600"
                        >
                          {departmentMutationError}
                        </p>
                      )}
                  </div>
                </div>

                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {departments.map(
                    (department) => (
                      <div
                        key={
                          department.id
                        }
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            openDepartmentRecords(
                              department
                            )
                          }
                          className="block w-full p-6 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-900"
                          aria-label={`View documents and metadata for ${department.name}`}
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

                          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                            View department records →
                          </p>
                        </button>

                        <div className="flex items-center border-t border-slate-100 px-6 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              openEditDepartmentModal(
                                department
                              )
                            }
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
    </>
  );
}

