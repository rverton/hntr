function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Tag({ name, color = 'gray' }) {
  const bgColor = 'bg-gray-100';
  const fgColor = 'text-gray-800';

  if (color == 'blue') {
    bgColor = 'bg-blue-100';
    fgColor = 'text-blue-800';
  }

  return (
    <span className={classNames('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', bgColor, fgColor)}>
      {name}
    </span>
  )
}