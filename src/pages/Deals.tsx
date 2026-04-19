import { useEffect, useMemo, useState } from 'react'

type DealRecord = {
  _id: string
  [key: string]: unknown
}

type DealCategory = {
  category_display_name?: string
}

const DEALS_PER_PAGE = 20

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

function DealsPage() {
  const [deals, setDeals] = useState<DealRecord[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const response = await fetch('http://localhost:5000/api/v1/deals')

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data = await response.json()

        if (!Array.isArray(data.data)) {
          throw new Error('Deals response did not include a data array')
        }

        setDeals(data.data)
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

  return (
    <div className='container'>
      <div className='flex flex-col gap-2 mb-6 mt-6 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Deals</h1>
          <p className='text-sm text-gray-400'>
            Displaying all fields for each deal record.
          </p>
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
                <div className='flex flex-wrap items-center gap-3 mb-4'>
                  {INLINE_FIELDS.map((fieldName) => (
                    <div
                      key={fieldName}
                      className='inline-flex items-center gap-2 rounded-full bg-gray-900/40 px-3 py-1.5 text-sm'
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

                <div className='mt-4 flex flex-wrap gap-4 text-xs italic text-gray-300'>
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
    </div>
  )
}

export default DealsPage
