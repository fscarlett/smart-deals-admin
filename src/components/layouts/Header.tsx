import { Show, SignInButton, UserButton } from '@clerk/react'
import { NavLink } from 'react-router'

import styles from '../../styles/Header.module.css'

function Header() {
  return (
    <header className='px-4 bg-gray-800 '>
      <div className='container max-w-7xl mx-auto flex justify-between items-center'>
        <div>
          <h1 className='text-lg'>iQ Smart Deals Admin</h1>
        </div>
        <div>
          <Show when='signed-out'>
            <SignInButton />
            {/* <SignUpButton /> */}
          </Show>
          <Show when='signed-in'>
            <div className='flex items-center space-x-4'>
              <div>
                <nav className='flex space-x-4'>
                  <NavLink
                    to='/'
                    className={({ isActive }) =>
                      isActive ? styles.active_link : styles.default_link
                    }
                  >
                    Dashboard
                  </NavLink>
                  <NavLink
                    to='/categories'
                    className={({ isActive }) =>
                      isActive ? styles.active_link : styles.default_link
                    }
                  >
                    Categories
                  </NavLink>
                  <NavLink
                    to='/deals'
                    className={({ isActive }) =>
                      isActive ? styles.active_link : styles.default_link
                    }
                  >
                    Deals
                  </NavLink>
                </nav>
              </div>
              <UserButton />
            </div>
          </Show>
        </div>
      </div>
    </header>
  )
}
export default Header
