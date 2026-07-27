import CrudPage from '../components/CrudPage.jsx'

export default function Trucks() {
  return (
    <CrudPage
      title="Truck"
      collection="trucks"
      columns={[
        { key: 'vehicleNumber', label: 'Vehicle Number', required: true },
        { key: 'type', label: 'Type' },
        { key: 'size', label: 'Size' },
        { key: 'capacity', label: 'Capacity (tons)' },
        { key: 'owner', label: 'Owner' },
      ]}
    />
  )
}
