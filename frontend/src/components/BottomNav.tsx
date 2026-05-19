import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Scale, User } from 'lucide-react'

const links = [
  { to: '/', label: 'Dziś', Icon: LayoutDashboard },
  { to: '/planner', label: 'Jadłospis', Icon: CalendarDays },
  { to: '/measurements', label: 'Pomiary', Icon: Scale },
  { to: '/profile', label: 'Profil', Icon: User },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t-[3px] border-lily/20 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-sm mx-auto px-2">
        {links.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors cursor-pointer ${
                isActive ? 'text-lily' : 'text-lily/35'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
