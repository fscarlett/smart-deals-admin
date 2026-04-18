import { useEffect, useState } from 'react'
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

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/v1/categories/')
        const data = await response.json()
        console.log(data)
        const sorted = [...data.data].sort(
          (a, b) => a.category_order - b.category_order,
        )
        setCategories(sorted)
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      }
    }

    fetchCategories()
  }, [])

  return (
    <div className='container'>
      <h1 className='text-2xl font-bold mb-6 mt-6'>Categories</h1>
      <ul className='list-none p-0 m-0'>
        {categories.map((cat) => (
          <li
            key={cat._id}
            className='text-sm flex flex-col gap-6 py-3 mb-8 border-b-1 border-gray-600'
          >
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
            <div className='text-xs italic gap-4 flex flex-wrap'>
              <span>Created: {new Date(cat.createdAt).toLocaleString()} </span>
              <span>Updated: {new Date(cat.updatedAt).toLocaleString()} </span>
            </div>
            {/* <span>
              <strong>__v:</strong> {cat.__v}
            </span> */}
          </li>
        ))}
      </ul>
    </div>
  )
}
export default CategoriesPage
