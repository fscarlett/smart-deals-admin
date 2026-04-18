import { Show, SignInButton, UserButton } from '@clerk/react'
import { NavLink, useLocation } from 'react-router'

import styles from '../../styles/Header.module.css'

function Header() {
  const location = useLocation()

  const from =
    location.state &&
    typeof location.state === 'object' &&
    'from' in location.state &&
    location.state.from &&
    typeof location.state.from === 'object'
      ? location.state.from
      : null

  const returnTo =
    from && 'pathname' in from && typeof from.pathname === 'string'
      ? `${from.pathname}${
          'search' in from && typeof from.search === 'string' ? from.search : ''
        }${'hash' in from && typeof from.hash === 'string' ? from.hash : ''}`
      : '/'

  return (
    <header className='site_header px-4 bg-gray-800 '>
      <div className='container max-w-7xl mx-auto flex justify-between items-center h-[58px]'>
        <div>
          <h1 className='text-lg'>iQ Smart Deals Admin</h1>
        </div>
        <div>
          <Show when='signed-out'>
            <div className={styles.default_link}>
              <SignInButton
                forceRedirectUrl={returnTo}
                fallbackRedirectUrl='/'
              />
              {/* <SignUpButton /> */}
            </div>
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
