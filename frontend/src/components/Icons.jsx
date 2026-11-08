const S = ({ children, size = 20, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export const SearchIcon = () => <S size={18} sw={2}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></S>;
export const BellIcon = () => <S size={22}><path d="M6 9a6 6 0 1 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0" /></S>;
export const ClipboardIcon = () => <S size={22}><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9zM9 12h6M9 16h4" /></S>;
export const FileIcon = () => <S size={22}><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4" /></S>;
export const ClockIcon = () => <S size={22}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></S>;
export const CheckIcon = () => <S size={22}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></S>;
export const PhoneIcon = () => <S size={16} sw={2}><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" /></S>;
export const VideoIcon = () => <S size={16} sw={2}><rect x="3" y="6" width="12" height="12" rx="2" /><path d="m15 10 6-3v10l-6-3z" /></S>;
export const ChatIcon = () => <S size={16} sw={2}><path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.2A8 8 0 1 1 21 12z" /></S>;
export const DotsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
  </svg>
);
