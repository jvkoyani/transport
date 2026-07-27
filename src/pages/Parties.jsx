import CrudPage from '../components/CrudPage.jsx'

export default function Parties() {
  return (
    <CrudPage
      title="Party"
      collection="parties"
      columns={[
        { key: 'name', label: 'Party Name', required: true },
        { key: 'city', label: 'City' },
        { key: 'gstin', label: 'GSTIN' },
        { key: 'phone', label: 'Phone' },
      ]}
    />
  )
}
