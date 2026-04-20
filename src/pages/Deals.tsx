import { useEffect, useMemo, useRef, useState } from 'react'

type DealRecord = {
  _id: string
  [key: string]: unknown
}

type DealFormValue = string | boolean

type DealCategory = {
  _id?: string
  category_slug?: string
  category_display_name?: string
  category_order?: number
  is_active?: boolean
  createdAt?: string
  updatedAt?: string
  __v?: number
}

const DEALS_PER_PAGE = 20
const EDIT_EXCLUDED_FIELDS = new Set(['_id', '__v', 'createdAt', 'updatedAt'])

const HIDDEN_FIELDS = new Set([
  '_id',
  'deal_slug',
  'merchant_code',
  'deal_code',
  'deal_cta_text',
  'description',
  '__v',
  'deal_url',
  'logo_img_url',
  'logo_bg_color',
  'img_thumbnail_url',
  'img_full_url',
  'img_mob_url',
  'deal_copy_desktop',
  'deal_copy_mob',
])

const INLINE_FIELD_LABELS: Record<string, string> = {
  merchant_display_name: 'Merchant',
  is_in_hero: 'Hero',
  is_featured: 'Featured',
  is_featured_secondary: 'Secondary Featured',
  deal_cashback_percent: 'Cashback',
  deal_pill_text: 'Pill Text',
  category: 'Category',
  isActive: 'Active',
  coupon_type: 'Coupon',
  startDate: 'Start',
  endDate: 'End',
}

const FIELD_LABELS: Record<string, string> = {
  ...INLINE_FIELD_LABELS,
  createdAt: 'Created',
  updatedAt: 'Modified',
}

const INLINE_FIELDS = Object.keys(INLINE_FIELD_LABELS)
const META_DATE_FIELDS = ['createdAt', 'updatedAt'] as const

function createFormValues(deal: DealRecord) {
  return Object.fromEntries(
    Object.entries(deal)
      .filter(([fieldName]) => !EDIT_EXCLUDED_FIELDS.has(fieldName))
      .map(([fieldName, value]) => [
        fieldName,
        serializeFormValue(fieldName, value),
      ]),
  ) as Record<string, DealFormValue>
}

function serializeFormValue(fieldName: string, value: unknown): DealFormValue {
  if (fieldName === 'category') {
    if (!Array.isArray(value) || value.length === 0) {
      return ''
    }

    const firstCategory = value[0]

    if (!firstCategory || typeof firstCategory !== 'object') {
      return ''
    }

    return '_id' in firstCategory && typeof firstCategory._id === 'string'
      ? firstCategory._id
      : ''
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

function parseFormValue(
  fieldName: string,
  value: DealFormValue,
  originalValue: unknown,
  categories: DealCategory[],
) {
  if (fieldName === 'category') {
    if (typeof value !== 'string' || value.trim() === '') {
      return []
    }

    const selectedCategory = categories.find(
      (category) => category._id === value,
    )

    if (!selectedCategory || !selectedCategory._id) {
      throw new Error('Please select a valid category.')
    }

    return [selectedCategory._id]
  }

  if (typeof originalValue === 'boolean') {
    return Boolean(value)
  }

  if (typeof originalValue === 'number') {
    if (typeof value !== 'string' || value.trim() === '') {
      return 0
    }

    const parsedNumber = Number(value)

    if (Number.isNaN(parsedNumber)) {
      throw new Error('A numeric field contains an invalid value.')
    }

    return parsedNumber
  }

  if (Array.isArray(originalValue)) {
    if (typeof value !== 'string' || value.trim() === '') {
      return []
    }

    const parsedArray = JSON.parse(value)

    if (!Array.isArray(parsedArray)) {
      throw new Error('An array field must contain valid JSON array data.')
    }

    return parsedArray
  }

  if (originalValue && typeof originalValue === 'object') {
    if (typeof value !== 'string' || value.trim() === '') {
      return null
    }

    const parsedObject = JSON.parse(value)

    if (
      !parsedObject ||
      typeof parsedObject !== 'object' ||
      Array.isArray(parsedObject)
    ) {
      throw new Error('An object field must contain valid JSON object data.')
    }

    return parsedObject
  }

  return typeof value === 'string' ? value : String(value)
}

function shouldUseTextarea(fieldName: string, value: unknown) {
  if (fieldName === 'category') {
    return false
  }

  if (Array.isArray(value) || (value !== null && typeof value === 'object')) {
    return true
  }

  if (typeof value !== 'string') {
    return false
  }

  return (
    value.length > 60 ||
    fieldName === 'description' ||
    fieldName.includes('copy') ||
    fieldName.includes('url')
  )
}

function formatCategoryValue(value: unknown) {
  if (!Array.isArray(value)) {
    return null
  }

  const categoryNames = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const category = item as DealCategory

      return typeof category.category_display_name === 'string'
        ? category.category_display_name
        : null
    })
    .filter((name): name is string => Boolean(name))

  if (categoryNames.length === 0) {
    return null
  }

  return categoryNames.join(', ')
}

function formatDateValue(value: unknown) {
  if (typeof value !== 'string') {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const month = date.toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  })
  const day = String(date.getUTCDate()).padStart(2, '0')
  const year = date.getUTCFullYear()

  return `${month}-${day}-${year}`
}

function isMetaDateField(fieldName: string) {
  return fieldName === 'createdAt' || fieldName === 'updatedAt'
}

function formatFieldValue(fieldName: string, value: unknown) {
  if (
    fieldName === 'coupon_type' &&
    (value === null || value === undefined || value === '')
  ) {
    return ''
  }

  if (value === null || value === undefined || value === '') {
    return <span className='italic text-gray-400'>Empty</span>
  }

  if (fieldName === 'category') {
    return (
      formatCategoryValue(value) ?? (
        <span className='italic text-gray-400'>Empty</span>
      )
    )
  }

  if (fieldName === 'startDate' || fieldName === 'endDate') {
    return formatDateValue(value) ?? String(value)
  }

  if (isMetaDateField(fieldName)) {
    return formatDateValue(value) ?? String(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'object') {
    return (
      <pre className='whitespace-pre-wrap wrap-break-word text-xs bg-gray-900/50 rounded-md p-3'>
        {JSON.stringify(value, null, 2)}
      </pre>
    )
  }

  return String(value)
}

function formatFieldLabel(fieldName: string) {
  return FIELD_LABELS[fieldName] ?? fieldName
}

function normalizeDealCategory(value: unknown, categories: DealCategory[]) {
  if (!Array.isArray(value)) {
    return value
  }

  return value
    .map((item) => {
      if (typeof item === 'string') {
        return categories.find((category) => category._id === item) ?? null
      }

      if (item && typeof item === 'object') {
        return item
      }

      return null
    })
    .filter((item): item is DealCategory => Boolean(item))
}

function normalizeDealRecordCategories(
  deal: DealRecord,
  categories: DealCategory[],
) {
  return {
    ...deal,
    category: normalizeDealCategory(deal.category, categories),
  }
}

function DealsPage() {
  const [deals, setDeals] = useState<DealRecord[]>([])
  const [categories, setCategories] = useState<DealCategory[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [editingDeal, setEditingDeal] = useState<DealRecord | null>(null)
  const [formValues, setFormValues] = useState<Record<string, DealFormValue>>(
    {},
  )
  const [isSaving, setIsSaving] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('')
  const modalBodyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const [dealsResponse, categoriesResponse] = await Promise.all([
          fetch('http://localhost:5000/api/v1/deals'),
          fetch('http://localhost:5000/api/v1/categories/'),
        ])

        if (!dealsResponse.ok) {
          throw new Error(`Request failed with status ${dealsResponse.status}`)
        }

        if (!categoriesResponse.ok) {
          throw new Error(
            `Request failed with status ${categoriesResponse.status}`,
          )
        }

        const [dealsData, categoriesData] = await Promise.all([
          dealsResponse.json(),
          categoriesResponse.json(),
        ])

        if (!Array.isArray(dealsData.data)) {
          throw new Error('Deals response did not include a data array')
        }

        if (!Array.isArray(categoriesData.data)) {
          throw new Error('Categories response did not include a data array')
        }

        setDeals(dealsData.data)
        setCategories(
          [...categoriesData.data].sort(
            (a: DealCategory, b: DealCategory) =>
              (a.category_order ?? 0) - (b.category_order ?? 0),
          ),
        )
      } catch (error) {
        console.error('Failed to fetch deals:', error)
        setErrorMessage('Failed to load deals.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchDeals()
  }, [])

  const totalPages = Math.max(1, Math.ceil(deals.length / DEALS_PER_PAGE))

  const paginatedDeals = useMemo(() => {
    const startIndex = (currentPage - 1) * DEALS_PER_PAGE

    return deals.slice(startIndex, startIndex + DEALS_PER_PAGE)
  }, [currentPage, deals])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const startRecord =
    deals.length === 0 ? 0 : (currentPage - 1) * DEALS_PER_PAGE + 1
  const endRecord = Math.min(currentPage * DEALS_PER_PAGE, deals.length)

  const editableFieldEntries = useMemo(() => {
    if (!editingDeal) {
      return [] as Array<[string, unknown]>
    }

    return Object.entries(editingDeal).filter(
      ([fieldName]) => !EDIT_EXCLUDED_FIELDS.has(fieldName),
    )
  }, [editingDeal])

  function openEditModal(deal: DealRecord) {
    setEditingDeal(deal)
    setFormValues(createFormValues(deal))
    setSaveErrorMessage('')
    setSaveSuccessMessage('')
  }

  function closeEditModal() {
    setEditingDeal(null)
    setFormValues({})
    setIsSaving(false)
    setSaveErrorMessage('')
    setSaveSuccessMessage('')
  }

  function handleFieldChange(fieldName: string, value: DealFormValue) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }))
  }

  async function handleSaveEdits(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!editingDeal) {
      return
    }

    modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      setIsSaving(true)
      setSaveErrorMessage('')
      setSaveSuccessMessage('')

      const payload = Object.fromEntries(
        editableFieldEntries.map(([fieldName, originalValue]) => [
          fieldName,
          parseFormValue(
            fieldName,
            formValues[fieldName],
            originalValue,
            categories,
          ),
        ]),
      )

      const response = await fetch(
        `http://localhost:5000/api/v1/deals/${editingDeal._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
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
        throw new Error('Failed to save your edits.')
      }

      const updatedDealFromResponse =
        responseData &&
        typeof responseData === 'object' &&
        'data' in responseData &&
        responseData.data &&
        typeof responseData.data === 'object'
          ? normalizeDealRecordCategories(
              {
                ...editingDeal,
                ...(responseData.data as Record<string, unknown>),
              } as DealRecord,
              categories,
            )
          : normalizeDealRecordCategories(
              { ...editingDeal, ...payload } as DealRecord,
              categories,
            )

      setDeals((currentDeals) =>
        currentDeals.map((deal) =>
          deal._id === editingDeal._id ? updatedDealFromResponse : deal,
        ),
      )
      setEditingDeal(updatedDealFromResponse)
      setFormValues(createFormValues(updatedDealFromResponse))
      setSaveSuccessMessage('Your edits were saved')
    } catch (error) {
      console.error('Failed to save deal edits:', error)
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
          <h1 className='text-2xl font-bold'>Deals</h1>
          <p className='text-sm text-gray-400'>Displaying deal records.</p>
        </div>
        <p className='text-sm text-gray-400'>
          {startRecord}-{endRecord} of {deals.length} deals
        </p>
      </div>

      {isLoading ? <p>Loading deals...</p> : null}
      {errorMessage ? <p className='text-red-400'>{errorMessage}</p> : null}

      {!isLoading && !errorMessage ? (
        <>
          <ul className='list-none p-0 m-0'>
            {paginatedDeals.map((deal) => (
              <li key={deal._id} className='py-4 border-b border-gray-600'>
                <div className='mb-2 flex items-start justify-between gap-4'>
                  <div className='flex flex-wrap items-center gap-3'>
                    {INLINE_FIELDS.map((fieldName) => (
                      <div
                        key={fieldName}
                        className='inline-flex items-center gap-1 rounded-full bg-gray-900/40 py-0 pr-2 text-sm'
                      >
                        <span className='font-semibold text-gray-300'>
                          {formatFieldLabel(fieldName)}:
                        </span>
                        <span className='text-white'>
                          {formatFieldValue(fieldName, deal[fieldName])}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type='button'
                    className='shrink-0 rounded-md border border-gray-600 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800'
                    onClick={() => openEditModal(deal)}
                  >
                    Edit
                  </button>
                </div>

                <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
                  {Object.entries(deal)
                    .filter(
                      ([fieldName]) =>
                        !HIDDEN_FIELDS.has(fieldName) &&
                        !INLINE_FIELDS.includes(fieldName) &&
                        !META_DATE_FIELDS.includes(
                          fieldName as (typeof META_DATE_FIELDS)[number],
                        ),
                    )
                    .map(([fieldName, value]) => (
                      <div key={fieldName} className='text-sm wrap-break-word'>
                        <div className='font-semibold text-gray-300 mb-1'>
                          {formatFieldLabel(fieldName)}
                        </div>
                        <div>{formatFieldValue(fieldName, value)}</div>
                      </div>
                    ))}
                </div>

                <div className='mt-0 flex flex-wrap gap-4 text-xs italic text-gray-300'>
                  {META_DATE_FIELDS.map((fieldName) => (
                    <div key={fieldName}>
                      <span className='font-semibold'>
                        {formatFieldLabel(fieldName)}:
                      </span>{' '}
                      <span>
                        {formatFieldValue(fieldName, deal[fieldName])}
                      </span>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          {deals.length > DEALS_PER_PAGE ? (
            <div className='flex flex-col gap-4 mt-6 mb-8 sm:flex-row sm:items-center sm:justify-between'>
              <div className='text-sm text-gray-400'>
                Page {currentPage} of {totalPages}
              </div>
              <div className='flex flex-wrap gap-2'>
                <button
                  type='button'
                  className='px-3 py-2 rounded-md border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {Array.from(
                  { length: totalPages },
                  (_, index) => index + 1,
                ).map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type='button'
                    className={`px-3 py-2 rounded-md border ${
                      pageNumber === currentPage
                        ? 'border-white bg-white text-black'
                        : 'border-gray-600'
                    }`}
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                ))}
                <button
                  type='button'
                  className='px-3 py-2 rounded-md border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      {editingDeal ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8'>
          <div className='w-full max-w-4xl rounded-xl border border-gray-700 bg-gray-950 shadow-2xl'>
            <div className='flex items-center justify-between border-b border-gray-800 px-6 py-4'>
              <div>
                <h2 className='text-xl font-semibold'>Edit Deal</h2>
                <p className='text-sm text-gray-400'>
                  Update the selected deal record.
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

            <form onSubmit={handleSaveEdits}>
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

                <div className='grid gap-5 md:grid-cols-2'>
                  {editableFieldEntries.map(([fieldName, originalValue]) => {
                    const formValue = formValues[fieldName]
                    const textarea = shouldUseTextarea(fieldName, originalValue)

                    return (
                      <label
                        key={fieldName}
                        className='flex flex-col gap-2 text-sm'
                      >
                        <span className='font-semibold text-gray-200'>
                          {formatFieldLabel(fieldName)}
                        </span>

                        {fieldName === 'category' ? (
                          <select
                            className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-gray-500'
                            value={
                              typeof formValue === 'string'
                                ? formValue
                                : String(formValue)
                            }
                            onChange={(event) =>
                              handleFieldChange(fieldName, event.target.value)
                            }
                          >
                            <option value=''>Select a category</option>
                            {categories.map((category) => (
                              <option key={category._id} value={category._id}>
                                {category.category_display_name}
                              </option>
                            ))}
                          </select>
                        ) : typeof originalValue === 'boolean' ? (
                          <input
                            type='checkbox'
                            className='h-4 w-4 rounded border-gray-600 bg-gray-900 accent-white'
                            checked={Boolean(formValue)}
                            onChange={(event) =>
                              handleFieldChange(fieldName, event.target.checked)
                            }
                          />
                        ) : textarea ? (
                          <textarea
                            className='min-h-32 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 font-mono text-sm text-white outline-none focus:border-gray-500'
                            value={
                              typeof formValue === 'string'
                                ? formValue
                                : String(formValue)
                            }
                            onChange={(event) =>
                              handleFieldChange(fieldName, event.target.value)
                            }
                          />
                        ) : (
                          <input
                            type={
                              typeof originalValue === 'number'
                                ? 'number'
                                : 'text'
                            }
                            step={
                              typeof originalValue === 'number'
                                ? 'any'
                                : undefined
                            }
                            className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-gray-500'
                            value={
                              typeof formValue === 'string'
                                ? formValue
                                : String(formValue)
                            }
                            onChange={(event) =>
                              handleFieldChange(fieldName, event.target.value)
                            }
                          />
                        )}
                      </label>
                    )
                  })}
                </div>

                <div className='mt-6 flex flex-wrap gap-4 border-t border-gray-800 pt-4 text-xs text-gray-400'>
                  <div>
                    <span className='font-semibold text-gray-300'>
                      Created:
                    </span>{' '}
                    <span>
                      {formatFieldValue('createdAt', editingDeal.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className='font-semibold text-gray-300'>
                      Updated:
                    </span>{' '}
                    <span>
                      {formatFieldValue('updatedAt', editingDeal.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className='flex items-center justify-end gap-3 border-t border-gray-800 px-6 py-4'>
                <button
                  type='button'
                  className='rounded-md border border-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-900'
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
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

export default DealsPage
