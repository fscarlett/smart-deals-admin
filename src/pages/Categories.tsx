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
            className='flex flex-wrap gap-6 py-3 mb-7 border-b-2 border-gray-300'
          >
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
            <span>
              <strong>Created:</strong>{' '}
              {new Date(cat.createdAt).toLocaleString()}
            </span>
            <span>
              <strong>Updated:</strong>{' '}
              {new Date(cat.updatedAt).toLocaleString()}
            </span>
            <span>
              <strong>__v:</strong> {cat.__v}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
export default CategoriesPage
