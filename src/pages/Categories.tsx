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
  const modalBodyRef = useRef<HTMLDivElement | null>(null)

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
      <h1 className='text-2xl font-bold mb-6 mt-6'>Categories</h1>
      <ul className='list-none p-0 m-0'>
        {categories.map((cat) => (
          <li
            key={cat._id}
            className='text-sm flex flex-col gap-6 py-3 mb-8 border-b border-gray-600'
          >
            <div className='flex items-start justify-between gap-4'>
              <div className='text-sm flex flex-wrap gap-6 py-3'>
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
              <button
                type='button'
                className='shrink-0 rounded-md border border-gray-600 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800'
                onClick={() => openEditModal(cat)}
              >
                Edit
              </button>
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
    </div>
  )
}
export default CategoriesPage
