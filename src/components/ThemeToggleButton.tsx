import { useEffect, useState } from "react";


const ThemeToggleButton = () => {
  const themes = ['light', 'dark'];
  const [theme, setTheme] = useState('');

  // Initialize theme on component mount
  useEffect(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('theme')) {
      setTheme(localStorage.getItem('theme') || '');
    } else if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark').matches)
      setTheme('dark');
  }, [])

  // Apply theme class to document root
  useEffect(() => {
    const rootElement = typeof document !== 'undefined' ? document.documentElement : null;
    if (rootElement && theme === 'light') {
      rootElement.classList.remove('theme-dark');
    } else if (rootElement && theme === 'dark') {
      rootElement.classList.add('theme-dark');
    }
  }, [theme])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTheme = event.target.value;
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  }

  const icons = [
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fill-rule="evenodd"
        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
        clip-rule="evenodd"
      />
    </svg>,
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>,
  ];

  return (
    <div className="theme-toggle">
      {themes.map((t, i) => (
        <label key={t} className={theme === t ? 'checked' : ''}>
          {icons[i]}
          <input
            type="radio"
            name="theme-toggle"
            checked={theme === t}
            value={t}
            title={`Use ${t} theme`}
            aria-label={`Use ${t} theme`}
            onChange={handleChange}
          />
        </label>
      ))}
    </div>
  );

}

export default ThemeToggleButton;
