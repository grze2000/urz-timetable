import { FaCalendar } from "react-icons/fa";
import { IoHome, IoSettingsSharp } from "react-icons/io5";

export const navigationConfig = [
  {
    href: '/timetable',
    icon: FaCalendar,
    label: 'Plan zajęć'
  },
  {
    href: '/day',
    icon: IoHome,
    label: 'Mój dzień'
  },
  {
    href: '/settings',
    icon: IoSettingsSharp,
    label: 'Ustawienia'
  },
]