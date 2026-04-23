import { Show } from '@clerk/react'
import { useEffect, useState } from 'react'
import { buildApiUrl } from './api'

function App() {
  const [totalDeals, setTotalDeals] = useState<number | null>(null)
  const [activeDeals, setActiveDeals] = useState<number | null>(null)
  const [totalCategories, setTotalCategories] = useState<number | null>(null)
  const [statsError, setStatsError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [dealsResponse, categoriesResponse] = await Promise.all([
          fetch(buildApiUrl('/deals')),
          fetch(buildApiUrl('/categories/')),
        ])

        if (!dealsResponse.ok || !categoriesResponse.ok) {
          throw new Error('Failed to load stats.')
        }

        const [dealsData, categoriesData] = await Promise.all([
          dealsResponse.json(),
          categoriesResponse.json(),
        ])

        const deals: { isActive?: boolean }[] = Array.isArray(dealsData.data)
          ? dealsData.data
          : []
        const categories: unknown[] = Array.isArray(categoriesData.data)
          ? categoriesData.data
          : []

        setTotalDeals(deals.length)
        setActiveDeals(deals.filter((d) => d.isActive === true).length)
        setTotalCategories(categories.length)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
        setStatsError('Failed to load stats.')
      }
    }

    fetchStats()
  }, [])

  return (
    <>
      <div className='container min-h-screen flex flex-col items-center justify-items-start bg-gray-900 text-white'>
        <section className='text-center pt-10 pb-20'>
          <Show when='signed-out'>
            <p>Please sign in to access the admin panel.</p>
          </Show>
          <Show when='signed-in'>
            <p className=''>Welcome to iQ Smart Deals Admin Panel</p>
          </Show>
        </section>
        <Show when='signed-in'>
          <section>
            <div>
              <h2 className='text-2xl font-bold mb-4 h2'>Stats</h2>
              {statsError ? (
                <p className='text-red-400 text-sm'>{statsError}</p>
              ) : (
                <div className='flex flex-wrap gap-6'>
                  <div className='rounded-xl border border-gray-700 bg-gray-900 px-6 py-4 text-center'>
                    <div className='text-3xl font-bold'>
                      {totalDeals ?? '—'}
                    </div>
                    <div className='text-sm text-gray-400 mt-1'>
                      Total Deals
                    </div>
                  </div>
                  <div className='rounded-xl border border-gray-700 bg-gray-900 px-6 py-4 text-center'>
                    <div className='text-3xl font-bold'>
                      {activeDeals ?? '—'}
                    </div>
                    <div className='text-sm text-gray-400 mt-1'>
                      Active Deals
                    </div>
                  </div>
                  <div className='rounded-xl border border-gray-700 bg-gray-900 px-6 py-4 text-center'>
                    <div className='text-3xl font-bold'>
                      {totalCategories ?? '—'}
                    </div>
                    <div className='text-sm text-gray-400 mt-1'>
                      Total Categories
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </Show>
      </div>
    </>
  )
}

export default App
