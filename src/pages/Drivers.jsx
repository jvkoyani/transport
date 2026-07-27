import CrudPage from '../components/CrudPage.jsx'

export default function Drivers() {
  return (
    <CrudPage
      title="Driver"
      collection="drivers"
      columns={[
        { key: 'name', label: 'Driver Name', required: true },
        { key: 'phone', label: 'Phone' },
        { key: 'license', label: 'License No.' },
      ]}
    />
  )
}
