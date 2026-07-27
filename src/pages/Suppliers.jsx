import CrudPage from '../components/CrudPage.jsx'

export default function Suppliers() {
  return (
    <CrudPage
      title="Supplier"
      collection="suppliers"
      columns={[
        { key: 'name', label: 'Supplier Name', required: true },
        { key: 'city', label: 'City' },
        { key: 'phone', label: 'Phone' },
        { key: 'gstin', label: 'GSTIN' },
      ]}
    />
  )
}
