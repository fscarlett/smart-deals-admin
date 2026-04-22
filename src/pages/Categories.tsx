import { useEffect, useRef, useState } from 'react'
import { buildApiUrl } from '../api'

interface Category {
  _id: string
  category_slug: string
  category_display_name: string
  category_order: number
  is_active: boolean
  createdAt: string
  updatedAt: string
  __v: number
}

interface EditFormValues {
  category_display_name: string
  category_slug: string
  category_order: string
  is_active: boolean
}

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formValues, setFormValues] = useState<EditFormValues>({
    category_display_name: '',
    category_slug: '',
    category_order: '',
    is_active: true,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isEditCancelVisible, setIsEditCancelVisible] = useState(true)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('')
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  )
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('')
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createFormValues, setCreateFormValues] = useState<EditFormValues>({
    category_display_name: '',
    category_slug: '',
    category_order: '',
    is_active: true,
  })
  const [isCreating, setIsCreating] = useState(false)
  const [highlightedCategoryId, setHighlightedCategoryId] = useState('')
  const [createSuccessMessage, setCreateSuccessMessage] = useState('')
  const [createErrorMessage, setCreateErrorMessage] = useState('')
  const modalBodyRef = useRef<HTMLDivElement | null>(null)
  const createModalBodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(buildApiUrl('/categories/'))
        const data = await response.json()
        const sorted = [...data.data].sort(
          (a: Category, b: Category) => a.category_order - b.category_order,
        )
        setCategories(sorted)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }

    fetchCategories()
  }, [])

  function openCreateModal() {
    setIsCreateModalOpen(true)
    setCreateFormValues({
      category_display_name: '',
      category_slug: '',
      category_order: '',
      is_active: true,
    })
    setCreateSuccessMessage('')
    setCreateErrorMessage('')
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false)
    setIsCreating(false)
    setCreateSuccessMessage('')
    setCreateErrorMessage('')
  }

  async function handleCreate() {
    createModalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      setIsCreating(true)
      setCreateSuccessMessage('')
      setCreateErrorMessage('')

      const parsedOrder = Number(createFormValues.category_order)

      if (Number.isNaN(parsedOrder)) {
        throw new Error('Order must be a valid number.')
      }

      const payload = {
        category_display_name: createFormValues.category_display_name,
        category_slug: createFormValues.category_slug,
        category_order: parsedOrder,
        is_active: createFormValues.is_active,
      }

      const response = await fetch(buildApiUrl('/categories/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      let responseData: unknown = null

      try {
        responseData = await response.json()
      } catch {
        responseData = null
      }

      if (!response.ok) {
        const responseMessage =
          responseData &&
          typeof responseData === 'object' &&
          'message' in responseData &&
          typeof responseData.message === 'string'
            ? responseData.message
            : 'Failed to create the category.'

        throw new Error(responseMessage)
      }

      const createdCategory: Category =
        responseData &&
        typeof responseData === 'object' &&
        'data' in responseData &&
        responseData.data &&
        typeof responseData.data === 'object'
          ? (responseData.data as Category)
          : ({
              ...payload,
              _id: '',
              createdAt: '',
              updatedAt: '',
              __v: 0,
            } as Category)

      setCategories((current) =>
        [...current, createdCategory].sort(
          (a, b) => a.category_order - b.category_order,
        ),
      )
      setHighlightedCategoryId(createdCategory._id)
      closeCreateModal()
    } catch (error) {
      console.error('Failed to create category:', error)
      setCreateErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to create the category.',
      )
    } finally {
      setIsCreating(false)
    }
  }

  function openEditModal(cat: Category) {
    setEditingCategory(cat)
    setFormValues({
      category_display_name: cat.category_display_name,
      category_slug: cat.category_slug,
      category_order: String(cat.category_order),
      is_active: cat.is_active,
    })
    setIsEditCancelVisible(true)
    setSaveSuccessMessage('')
    setSaveErrorMessage('')
  }

  function closeEditModal() {
    setEditingCategory(null)
    setIsSaving(false)
    setIsEditCancelVisible(true)
    setSaveSuccessMessage('')
    setSaveErrorMessage('')
  }

  function handleFieldFocus() {
    setIsEditCancelVisible(true)
  }

  function openDeleteModal(cat: Category) {
    setDeletingCategory(cat)
    setDeleteSuccessMessage('')
    setDeleteErrorMessage('')
  }

  function closeDeleteModal() {
    setDeletingCategory(null)
    setIsDeleting(false)
    setDeleteSuccessMessage('')
    setDeleteErrorMessage('')
  }

  async function handleDelete() {
    if (!deletingCategory) {
      return
    }

    try {
      setIsDeleting(true)
      setDeleteSuccessMessage('')
      setDeleteErrorMessage('')

      const response = await fetch(
        buildApiUrl(`/categories/${deletingCategory._id}`),
        { method: 'DELETE' },
      )

      let responseData: unknown = null

      try {
        responseData = await response.json()
      } catch {
        responseData = null
      }

      if (!response.ok) {
        const responseMessage =
          responseData &&
          typeof responseData === 'object' &&
          'message' in responseData &&
          typeof responseData.message === 'string'
            ? responseData.message
            : 'Failed to delete the category.'

        throw new Error(responseMessage)
      }

      setCategories((current) =>
        current.filter((c) => c._id !== deletingCategory._id),
      )
      setDeleteSuccessMessage(
        `${deletingCategory.category_display_name} deleted!`,
      )
    } catch (error) {
      console.error('Failed to delete category:', error)
      setDeleteErrorMessage(
        error instanceof Error
          ? error.message
          : 'Failed to delete the category.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleSave() {
    if (!editingCategory) {
      return
    }

    modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      setIsSaving(true)
      setSaveSuccessMessage('')
      setSaveErrorMessage('')

      const parsedOrder = Number(formValues.category_order)

      if (Number.isNaN(parsedOrder)) {
        throw new Error('Order must be a valid number.')
      }

      const payload = {
        category_display_name: formValues.category_display_name,
        category_slug: formValues.category_slug,
        category_order: parsedOrder,
        is_active: formValues.is_active,
      }

      const response = await fetch(
        buildApiUrl(`/categories/${editingCategory._id}`),
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )

      let responseData: unknown = null

      try {
        responseData = await response.json()
      } catch {
        responseData = null
      }

      if (!response.ok) {
        const responseMessage =
          responseData &&
          typeof responseData === 'object' &&
          'message' in responseData &&
          typeof responseData.message === 'string'
            ? responseData.message
            : 'Failed to save your edits.'

        throw new Error(responseMessage)
      }

      const updatedCategory: Category = {
        ...editingCategory,
        ...payload,
      }

      setCategories((current) =>
        [
          ...current.map((c) =>
            c._id === editingCategory._id ? updatedCategory : c,
          ),
        ].sort((a, b) => a.category_order - b.category_order),
      )
      setEditingCategory(updatedCategory)
      setSaveSuccessMessage('Changes saved successfully.')
      setIsEditCancelVisible(false)
    } catch (error) {
      console.error('Failed to save category:', error)
      setSaveErrorMessage(
        error instanceof Error ? error.message : 'Failed to save your edits.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className='container'>
      <div className='flex flex-col gap-2 mb-6 mt-6 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Categories</h1>
          <p className='text-sm text-gray-400'>Displaying category records.</p>
          <div className='mt-4'>
            <button
              type='button'
              className='rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200'
              onClick={openCreateModal}
            >
              Create New Category
            </button>
          </div>
        </div>
      </div>
      <ul className='list-none p-0 m-0'>
        {categories.map((cat) => (
          <li
            key={cat._id}
            className={`text-sm flex flex-col gap-6 py-3 mb-8 border-b border-gray-600 transition-colors ${
              cat._id === highlightedCategoryId ? 'bg-cyan-800/50' : ''
            }`}
          >
            <div className='flex items-start justify-between gap-4'>
              <div className='text-sm flex flex-wrap gap-6'>
                <span>
                  <strong>ID:</strong> {cat._id}
                </span>
                <span>
                  <strong>Slug:</strong> {cat.category_slug}
                </span>
                <span>
                  <strong>Name:</strong> {cat.category_display_name}
                </span>
                <span>
                  <strong>Order:</strong> {cat.category_order}
                </span>
                <span>
                  <strong>Active:</strong> {cat.is_active ? 'Yes' : 'No'}
                </span>
              </div>
              <div className='flex shrink-0 flex-col items-stretch gap-6'>
                <button
                  type='button'
                  className='rounded-md border border-gray-600 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800'
                  onClick={() => openEditModal(cat)}
                >
                  Edit
                </button>
                <button
                  type='button'
                  className='rounded-md border border-red-700 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-950/40'
                  onClick={() => openDeleteModal(cat)}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className='text-xs italic gap-4 flex flex-wrap'>
              <span>Created: {new Date(cat.createdAt).toLocaleString()} </span>
              <span>Updated: {new Date(cat.updatedAt).toLocaleString()} </span>
            </div>
          </li>
        ))}
      </ul>

      {editingCategory ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8'>
          <div className='w-full max-w-lg rounded-xl border border-gray-700 bg-gray-950 shadow-2xl'>
            <div className='flex items-center justify-between border-b border-gray-800 px-6 py-4'>
              <div>
                <h2 className='text-xl font-semibold'>Edit Category</h2>
                <p className='text-sm text-gray-400'>
                  Update the selected category record.
                </p>
              </div>
              <button
                type='button'
                className='rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-900'
                onClick={closeEditModal}
              >
                Close
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                void handleSave()
              }}
            >
              <div
                ref={modalBodyRef}
                className='max-h-[75vh] overflow-y-auto px-6 py-5'
              >
                {saveSuccessMessage ? (
                  <div className='mb-4 rounded-md border border-green-700 bg-green-950 px-4 py-3 text-sm text-green-300'>
                    {saveSuccessMessage}
                  </div>
                ) : null}

                {saveErrorMessage ? (
                  <div className='mb-4 rounded-md border border-red-700 bg-red-950 px-4 py-3 text-sm text-red-300'>
                    {saveErrorMessage}
                  </div>
                ) : null}

                <div className='flex flex-col gap-5'>
                  <label className='flex flex-col gap-2 text-sm'>
                    <span className='font-semibold text-gray-200'>Name</span>
                    <input
                      type='text'
                      className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-gray-500'
                      value={formValues.category_display_name}
                      onChange={(event) =>
                        setFormValues((v) => ({
                          ...v,
                          category_display_name: event.target.value,
                        }))
                      }
                      onFocus={handleFieldFocus}
                    />
                  </label>

                  <label className='flex flex-col gap-2 text-sm'>
                    <span className='font-semibold text-gray-200'>Slug</span>
                    <input
                      type='text'
                      className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-gray-500'
                      value={formValues.category_slug}
                      onChange={(event) =>
                        setFormValues((v) => ({
                          ...v,
                          category_slug: event.target.value,
                        }))
                      }
                      onFocus={handleFieldFocus}
                    />
                  </label>

                  <label className='flex flex-col gap-2 text-sm'>
                    <span className='font-semibold text-gray-200'>Order</span>
                    <input
                      type='number'
                      step='1'
                      className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-gray-500'
                      value={formValues.category_order}
                      onChange={(event) =>
                        setFormValues((v) => ({
                          ...v,
                          category_order: event.target.value,
                        }))
                      }
                      onFocus={handleFieldFocus}
                    />
                  </label>

                  <label className='flex items-center gap-3 text-sm'>
                    <input
                      type='checkbox'
                      className='h-4 w-4 rounded border-gray-600 bg-gray-900 accent-white'
                      checked={formValues.is_active}
                      onChange={(event) =>
                        setFormValues((v) => ({
                          ...v,
                          is_active: event.target.checked,
                        }))
                      }
                      onFocus={handleFieldFocus}
                    />
                    <span className='font-semibold text-gray-200'>Active</span>
                  </label>
                </div>
              </div>

              <div className='flex items-center justify-end gap-3 border-t border-gray-800 px-6 py-4'>
                {isEditCancelVisible ? (
                  <button
                    type='button'
                    className='rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-900'
                    onClick={closeEditModal}
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  type='submit'
                  className='rounded-md bg-white px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60'
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {isCreateModalOpen ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8'>
          <div className='w-full max-w-lg rounded-xl border border-gray-700 bg-gray-950 shadow-2xl'>
            <div className='flex items-center justify-between border-b border-gray-800 px-6 py-4'>
              <div>
                <h2 className='text-xl font-semibold'>Create Category</h2>
                <p className='text-sm text-gray-400'>
                  Add a new category record.
                </p>
              </div>
              <button
                type='button'
                className='rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-900'
                onClick={closeCreateModal}
              >
                Close
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault()
                void handleCreate()
              }}
            >
              <div
                ref={createModalBodyRef}
                className='max-h-[75vh] overflow-y-auto px-6 py-5'
              >
                {createSuccessMessage ? (
                  <div className='mb-4 rounded-md border border-green-700 bg-green-950 px-4 py-3 text-sm text-green-300'>
                    {createSuccessMessage}
                  </div>
                ) : null}

                {createErrorMessage ? (
                  <div className='mb-4 rounded-md border border-red-700 bg-red-950 px-4 py-3 text-sm text-red-300'>
                    {createErrorMessage}
                  </div>
                ) : null}

                <div className='flex flex-col gap-5'>
                  <label className='flex flex-col gap-2 text-sm'>
                    <span className='font-semibold text-gray-200'>
                      Name <span className='text-red-400'>*</span>
                    </span>
                    <input
                      type='text'
                      className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-gray-500'
                      value={createFormValues.category_display_name}
                      onChange={(event) =>
                        setCreateFormValues((v) => ({
                          ...v,
                          category_display_name: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className='flex flex-col gap-2 text-sm'>
                    <span className='font-semibold text-gray-200'>
                      Slug <span className='text-red-400'>*</span>
                    </span>
                    <input
                      type='text'
                      className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-gray-500'
                      value={createFormValues.category_slug}
                      onChange={(event) =>
                        setCreateFormValues((v) => ({
                          ...v,
                          category_slug: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className='flex flex-col gap-2 text-sm'>
                    <span className='font-semibold text-gray-200'>Order</span>
                    <input
                      type='number'
                      step='1'
                      className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-gray-500'
                      value={createFormValues.category_order}
                      onChange={(event) =>
                        setCreateFormValues((v) => ({
                          ...v,
                          category_order: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label className='flex items-center gap-3 text-sm'>
                    <input
                      type='checkbox'
                      className='h-4 w-4 rounded border-gray-600 bg-gray-900 accent-white'
                      checked={createFormValues.is_active}
                      onChange={(event) =>
                        setCreateFormValues((v) => ({
                          ...v,
                          is_active: event.target.checked,
                        }))
                      }
                    />
                    <span className='font-semibold text-gray-200'>Active</span>
                  </label>
                </div>
              </div>

              <div className='flex items-center justify-end gap-3 border-t border-gray-800 px-6 py-4'>
                <button
                  type='button'
                  className='rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-900'
                  onClick={closeCreateModal}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='rounded-md bg-white px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60'
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deletingCategory ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8'>
          <div className='w-full max-w-xl rounded-xl border border-gray-700 bg-gray-950 shadow-2xl'>
            <div className='flex items-center justify-between border-b border-gray-800 px-6 py-4'>
              <h2 className='text-xl font-semibold'>
                Delete the {deletingCategory.category_display_name} Category?
              </h2>
              <button
                type='button'
                className='rounded-md border border-gray-700 px-3 py-2 text-sm text-gray-200 hover:bg-gray-900'
                onClick={closeDeleteModal}
              >
                Close
              </button>
            </div>

            <div className='px-6 py-5'>
              {deleteSuccessMessage ? (
                <div className='mb-4 rounded-md border border-green-700 bg-green-950 px-4 py-3 text-sm text-green-300'>
                  {deleteSuccessMessage}
                </div>
              ) : null}

              {deleteErrorMessage ? (
                <div className='mb-4 rounded-md border border-red-700 bg-red-950 px-4 py-3 text-sm text-red-300'>
                  {deleteErrorMessage}
                </div>
              ) : null}

              <div className='space-y-2 text-sm text-gray-300'>
                <p>
                  <span className='font-semibold text-gray-200'>
                    Record ID:
                  </span>{' '}
                  <span>{deletingCategory._id}</span>
                </p>
                <p>
                  <span className='font-semibold text-gray-200'>Slug:</span>{' '}
                  <span>{deletingCategory.category_slug}</span>
                </p>
              </div>
            </div>

            <div className='flex items-center justify-end gap-3 border-t border-gray-800 px-6 py-4'>
              {!deleteSuccessMessage ? (
                <button
                  type='button'
                  className='rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-900'
                  onClick={closeDeleteModal}
                >
                  Cancel
                </button>
              ) : null}
              {!deleteSuccessMessage ? (
                <button
                  type='button'
                  className='rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60'
                  onClick={() => {
                    void handleDelete()
                  }}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
export default CategoriesPage
