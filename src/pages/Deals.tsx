import { useEffect, useMemo, useRef, useState } from 'react'

type DealRecord = {
  _id: string
  [key: string]: unknown
}

type DealFormValue = string | boolean

type DealFieldType =
  | 'string'
  | 'boolean'
  | 'number'
  | 'date'
  | 'select'
  | 'textarea'
  | 'category'

type DealFieldDefinition = {
  name: string
  type: DealFieldType
  defaultValue: DealFormValue
  options?: string[]
}

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

const DEAL_FORM_FIELDS: DealFieldDefinition[] = [
  { name: 'deal_slug', type: 'string', defaultValue: '' },
  { name: 'merchant_display_name', type: 'string', defaultValue: '' },
  { name: 'merchant_code', type: 'string', defaultValue: '' },
  { name: 'deal_code', type: 'string', defaultValue: '' },
  { name: 'is_in_hero', type: 'boolean', defaultValue: false },
  { name: 'is_featured', type: 'boolean', defaultValue: false },
  { name: 'is_featured_secondary', type: 'boolean', defaultValue: false },
  { name: 'deal_cashback_percent', type: 'number', defaultValue: '1' },
  { name: 'deal_pill_text', type: 'string', defaultValue: '' },
  {
    name: 'deal_cta_text',
    type: 'select',
    defaultValue: 'Get Deal',
    options: ['Get Deal', 'Shop Now'],
  },
  {
    name: 'coupon_type',
    type: 'select',
    defaultValue: '',
    options: ['', '$10', '$4', '17%', '20%', '30%'],
  },
  { name: 'description', type: 'textarea', defaultValue: '' },
  { name: 'category', type: 'category', defaultValue: '' },
  { name: 'startDate', type: 'date', defaultValue: '' },
  { name: 'endDate', type: 'date', defaultValue: '' },
  { name: 'isActive', type: 'boolean', defaultValue: true },
  { name: 'deal_url', type: 'textarea', defaultValue: '' },
  { name: 'logo_img_url', type: 'textarea', defaultValue: '' },
  { name: 'logo_bg_color', type: 'string', defaultValue: '' },
  { name: 'img_thumbnail_url', type: 'textarea', defaultValue: '' },
  { name: 'img_full_url', type: 'textarea', defaultValue: '' },
  { name: 'img_mob_url', type: 'textarea', defaultValue: '' },
  { name: 'deal_copy_desktop', type: 'textarea', defaultValue: '' },
  { name: 'deal_copy_mob', type: 'textarea', defaultValue: '' },
]

const REQUIRED_CREATE_FIELDS = new Set(['deal_slug', 'merchant_display_name'])

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
    DEAL_FORM_FIELDS.map((field) => [
      field.name,
      serializeFormValue(field, deal[field.name]),
    ]),
  ) as Record<string, DealFormValue>
}

function formatDateInputValue(value: unknown) {
  if (typeof value !== 'string' || value.trim() === '') {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function serializeFormValue(
  field: DealFieldDefinition,
  value: unknown,
): DealFormValue {
  if (field.type === 'category') {
    if (!Array.isArray(value) || value.length === 0) {
      return field.defaultValue
    }

    const firstCategory = value[0]

    if (!firstCategory || typeof firstCategory !== 'object') {
      return field.defaultValue
    }

    return '_id' in firstCategory && typeof firstCategory._id === 'string'
      ? firstCategory._id
      : field.defaultValue
  }

  if (field.type === 'date') {
    return formatDateInputValue(value)
  }

  if (typeof value === 'boolean') {
    return value
  }

  if (value === null || value === undefined) {
    return field.defaultValue
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

function parseFormValue(
  field: DealFieldDefinition,
  value: DealFormValue,
  categories: DealCategory[],
) {
  if (field.type === 'category') {
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

  if (field.type === 'boolean') {
    return Boolean(value)
  }

  if (field.type === 'number') {
    if (typeof value !== 'string' || value.trim() === '') {
      return Number(field.defaultValue)
    }

    const parsedNumber = Number(value)

    if (Number.isNaN(parsedNumber)) {
      throw new Error('A numeric field contains an invalid value.')
    }

    return parsedNumber
  }

  if (field.type === 'date') {
    if (typeof value !== 'string' || value.trim() === '') {
      return null
    }

    return value
  }

  if (field.type === 'select') {
    if (typeof value !== 'string' || value.trim() === '') {
      return undefined
    }

    return value
  }

  return typeof value === 'string' ? value : String(value)
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

function createEmptyDealRecord() {
  return { _id: '' } as DealRecord
}

function DealsPage() {
  const [deals, setDeals] = useState<DealRecord[]>([])
  const [categories, setCategories] = useState<DealCategory[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [highlightedDealId, setHighlightedDealId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [editingDeal, setEditingDeal] = useState<DealRecord | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [deletingDeal, setDeletingDeal] = useState<DealRecord | null>(null)
  const [formValues, setFormValues] = useState<Record<string, DealFormValue>>(
    {},
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [saveErrorMessage, setSaveErrorMessage] = useState('')
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('')
  const [createErrorMessage, setCreateErrorMessage] = useState('')
  const [createSuccessMessage, setCreateSuccessMessage] = useState('')
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState('')
  const modalBodyRef = useRef<HTMLDivElement | null>(null)
  const createModalBodyRef = useRef<HTMLDivElement | null>(null)

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

  const editableFields = useMemo(() => {
    if (!editingDeal) {
      return [] as DealFieldDefinition[]
    }

    return DEAL_FORM_FIELDS
  }, [editingDeal])

  const createFields = DEAL_FORM_FIELDS

  function openCreateModal() {
    setIsCreateModalOpen(true)
    setFormValues(createFormValues(createEmptyDealRecord()))
    setCreateErrorMessage('')
    setCreateSuccessMessage('')
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false)
    setFormValues({})
    setIsCreating(false)
    setCreateErrorMessage('')
    setCreateSuccessMessage('')
  }

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

  function openDeleteModal(deal: DealRecord) {
    setDeletingDeal(deal)
    setDeleteErrorMessage('')
    setDeleteSuccessMessage('')
  }

  function closeDeleteModal() {
    setDeletingDeal(null)
    setIsDeleting(false)
    setDeleteErrorMessage('')
    setDeleteSuccessMessage('')
  }

  function handleFieldChange(fieldName: string, value: DealFormValue) {
    setFormValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }))
  }

  async function handleSaveEdits() {
    if (!editingDeal) {
      return
    }

    modalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      setIsSaving(true)
      setSaveErrorMessage('')
      setSaveSuccessMessage('')

      const payload = Object.fromEntries(
        editableFields.map((field) => [
          field.name,
          parseFormValue(field, formValues[field.name], categories),
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

  async function handleCreateDeal() {
    createModalBodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      setIsCreating(true)
      setCreateErrorMessage('')
      setCreateSuccessMessage('')

      const payload = Object.fromEntries(
        createFields.map((field) => [
          field.name,
          parseFormValue(field, formValues[field.name], categories),
        ]),
      )

      const response = await fetch('http://localhost:5000/api/v1/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
            : 'Failed to create the deal.'

        throw new Error(responseMessage)
      }

      const createdDeal =
        responseData &&
        typeof responseData === 'object' &&
        'data' in responseData &&
        responseData.data &&
        typeof responseData.data === 'object'
          ? normalizeDealRecordCategories(
              responseData.data as DealRecord,
              categories,
            )
          : normalizeDealRecordCategories(payload as DealRecord, categories)

      setDeals((currentDeals) => [createdDeal, ...currentDeals])
      setHighlightedDealId(createdDeal._id)
      setCurrentPage(1)
      closeCreateModal()
    } catch (error) {
      console.error('Failed to create deal:', error)
      setCreateErrorMessage(
        error instanceof Error ? error.message : 'Failed to create the deal.',
      )
    } finally {
      setIsCreating(false)
    }
  }

  async function handleDeleteDeal() {
    if (!deletingDeal) {
      return
    }

    try {
      setIsDeleting(true)
      setDeleteErrorMessage('')
      setDeleteSuccessMessage('')

      const response = await fetch(
        `http://localhost:5000/api/v1/deals/${deletingDeal._id}`,
        {
          method: 'DELETE',
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
            : 'Failed to delete the deal.'

        throw new Error(responseMessage)
      }

      setDeals((currentDeals) =>
        currentDeals.filter((deal) => deal._id !== deletingDeal._id),
      )
      setDeleteSuccessMessage(
        `${String(deletingDeal.merchant_display_name ?? 'Deal')} deleted!`,
      )
    } catch (error) {
      console.error('Failed to delete deal:', error)
      setDeleteErrorMessage(
        error instanceof Error ? error.message : 'Failed to delete the deal.',
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className='container'>
      <div className='flex flex-col gap-2 mb-6 mt-6 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Deals</h1>
          <p className='text-sm text-gray-400'>Displaying deal records.</p>
          <div className='mt-4'>
            <button
              type='button'
              className='rounded-md bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200'
              onClick={openCreateModal}
            >
              Create New Deal
            </button>
          </div>
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
              <li
                key={deal._id}
                className={`border-b border-gray-600 py-4 transition-colors ${
                  deal._id === highlightedDealId ? 'bg-gray-800/50' : ''
                }`}
              >
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

                  <div className='flex shrink-0 flex-col items-stretch gap-6'>
                    <button
                      type='button'
                      className='rounded-md border border-gray-600 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800'
                      onClick={() => openEditModal(deal)}
                    >
                      Edit
                    </button>
                    <button
                      type='button'
                      className='rounded-md border border-red-700 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-950/40'
                      onClick={() => openDeleteModal(deal)}
                    >
                      Delete
                    </button>
                  </div>
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

      {isCreateModalOpen ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8'>
          <div className='w-full max-w-4xl rounded-xl border border-gray-700 bg-gray-950 shadow-2xl'>
            <div className='flex items-center justify-between border-b border-gray-800 px-6 py-4'>
              <div>
                <h2 className='text-xl font-semibold'>Create Deal</h2>
                <p className='text-sm text-gray-400'>Add a new deal record.</p>
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
                void handleCreateDeal()
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

                <div className='grid gap-5 md:grid-cols-2'>
                  {createFields.map((field) => {
                    const formValue = formValues[field.name]

                    return (
                      <label
                        key={field.name}
                        className='flex flex-col gap-2 text-sm'
                      >
                        <span className='font-semibold text-gray-200'>
                          {formatFieldLabel(field.name)}
                          {REQUIRED_CREATE_FIELDS.has(field.name) ? (
                            <span className='ml-1 text-red-400'>*</span>
                          ) : null}
                        </span>

                        {field.type === 'category' ? (
                          <select
                            className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-gray-500'
                            value={
                              typeof formValue === 'string'
                                ? formValue
                                : String(formValue)
                            }
                            onChange={(event) =>
                              handleFieldChange(field.name, event.target.value)
                            }
                          >
                            <option value=''>Select a category</option>
                            {categories.map((category) => (
                              <option key={category._id} value={category._id}>
                                {category.category_display_name}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'boolean' ? (
                          <input
                            type='checkbox'
                            className='h-4 w-4 rounded border-gray-600 bg-gray-900 accent-white'
                            checked={Boolean(formValue)}
                            onChange={(event) =>
                              handleFieldChange(
                                field.name,
                                event.target.checked,
                              )
                            }
                          />
                        ) : field.type === 'textarea' ? (
                          <textarea
                            className='min-h-32 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 font-mono text-sm text-white outline-none focus:border-gray-500'
                            value={
                              typeof formValue === 'string'
                                ? formValue
                                : String(formValue)
                            }
                            onChange={(event) =>
                              handleFieldChange(field.name, event.target.value)
                            }
                          />
                        ) : field.type === 'select' ? (
                          <select
                            className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-gray-500'
                            value={
                              typeof formValue === 'string'
                                ? formValue
                                : String(formValue)
                            }
                            onChange={(event) =>
                              handleFieldChange(field.name, event.target.value)
                            }
                          >
                            {field.options?.map((option) => (
                              <option key={option || 'empty'} value={option}>
                                {option || 'None'}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={
                              field.type === 'number'
                                ? 'number'
                                : field.type === 'date'
                                  ? 'date'
                                  : 'text'
                            }
                            step={field.type === 'number' ? 'any' : undefined}
                            className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-gray-500'
                            value={
                              typeof formValue === 'string'
                                ? formValue
                                : String(formValue)
                            }
                            onChange={(event) =>
                              handleFieldChange(field.name, event.target.value)
                            }
                          />
                        )}
                      </label>
                    )
                  })}
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
                  {isCreating ? 'Creating...' : 'Create Deal'}
                </button>
              </div>
            </form>
          </div>
        </div>
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

            <form
              onSubmit={(event) => {
                event.preventDefault()
                void handleSaveEdits()
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

                <div className='grid gap-5 md:grid-cols-2'>
                  {editableFields.map((field) => {
                    const formValue = formValues[field.name]

                    return (
                      <label
                        key={field.name}
                        className='flex flex-col gap-2 text-sm'
                      >
                        <span className='font-semibold text-gray-200'>
                          {formatFieldLabel(field.name)}
                        </span>

                        {field.type === 'category' ? (
                          <select
                            className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-gray-500'
                            value={
                              typeof formValue === 'string'
                                ? formValue
                                : String(formValue)
                            }
                            onChange={(event) =>
                              handleFieldChange(field.name, event.target.value)
                            }
                          >
                            <option value=''>Select a category</option>
                            {categories.map((category) => (
                              <option key={category._id} value={category._id}>
                                {category.category_display_name}
                              </option>
                            ))}
                          </select>
                        ) : field.type === 'boolean' ? (
                          <input
                            type='checkbox'
                            className='h-4 w-4 rounded border-gray-600 bg-gray-900 accent-white'
                            checked={Boolean(formValue)}
                            onChange={(event) =>
                              handleFieldChange(
                                field.name,
                                event.target.checked,
                              )
                            }
                          />
                        ) : field.type === 'textarea' ? (
                          <textarea
                            className='min-h-32 rounded-md border border-gray-700 bg-gray-900 px-3 py-2 font-mono text-sm text-white outline-none focus:border-gray-500'
                            value={
                              typeof formValue === 'string'
                                ? formValue
                                : String(formValue)
                            }
                            onChange={(event) =>
                              handleFieldChange(field.name, event.target.value)
                            }
                          />
                        ) : field.type === 'select' ? (
                          <select
                            className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-gray-500'
                            value={
                              typeof formValue === 'string'
                                ? formValue
                                : String(formValue)
                            }
                            onChange={(event) =>
                              handleFieldChange(field.name, event.target.value)
                            }
                          >
                            {field.options?.map((option) => (
                              <option key={option || 'empty'} value={option}>
                                {option || 'None'}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={
                              field.type === 'number'
                                ? 'number'
                                : field.type === 'date'
                                  ? 'date'
                                  : 'text'
                            }
                            step={field.type === 'number' ? 'any' : undefined}
                            className='rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-gray-500'
                            value={
                              typeof formValue === 'string'
                                ? formValue
                                : String(formValue)
                            }
                            onChange={(event) =>
                              handleFieldChange(field.name, event.target.value)
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

      {deletingDeal ? (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8'>
          <div className='w-full max-w-xl rounded-xl border border-gray-700 bg-gray-950 shadow-2xl'>
            <div className='flex items-center justify-between border-b border-gray-800 px-6 py-4'>
              <h2 className='text-xl font-semibold'>
                Delete the{' '}
                {String(deletingDeal.merchant_display_name ?? 'Unknown')} Deal?
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
                  <span>{String(deletingDeal._id)}</span>
                </p>
                <p>
                  <span className='font-semibold text-gray-200'>
                    Deal Slug:
                  </span>{' '}
                  <span>{String(deletingDeal.deal_slug ?? '')}</span>
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
                    void handleDeleteDeal()
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

export default DealsPage
