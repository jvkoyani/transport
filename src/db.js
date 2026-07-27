// Lightweight localStorage-backed data layer with simple collections.
const PREFIX = 'transport-khata:'

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function read(collection) {
  try {
    const raw = localStorage.getItem(PREFIX + collection)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function write(collection, items) {
  localStorage.setItem(PREFIX + collection, JSON.stringify(items))
}

export function insert(collection, item) {
  const items = read(collection)
  const record = { id: newId(), createdAt: Date.now(), ...item }
  write(collection, [record, ...items])
  return record
}

export function update(collection, id, patch) {
  const items = read(collection).map((i) => (i.id === id ? { ...i, ...patch } : i))
  write(collection, items)
  return items.find((i) => i.id === id)
}

export function remove(collection, id) {
  write(
    collection,
    read(collection).filter((i) => i.id !== id),
  )
}

export function getById(collection, id) {
  return read(collection).find((i) => i.id === id)
}

// ---- Seed demo data on first run so dropdowns and lists aren't empty ----
export function seedIfEmpty() {
  if (localStorage.getItem(PREFIX + 'seeded')) return

  const parties = [
    { id: newId(), name: 'NIRANJAN PETRO CHEM', city: 'Ankleshwar', gstin: '24AAACN1234A1Z5', phone: '9825012345' },
    { id: newId(), name: 'BEST VALUE CHEM PVT LTD', city: 'Moxi', gstin: '24AAACB5678B1Z3', phone: '9825022345' },
    { id: newId(), name: 'VISUAL PHARMA CHEM', city: 'Panoli', gstin: '24AAACV9012C1Z1', phone: '9825032345' },
    { id: newId(), name: 'YOGI INTERMEDIATE PVT LTD', city: 'Panoli', gstin: '24AAACY3456D1Z9', phone: '9825042345' },
    { id: newId(), name: 'SPECTRUM ETHERS PVT LTD', city: 'Nashik', gstin: '27AAACS7890E1Z7', phone: '9825052345' },
    { id: newId(), name: 'KHODIYAR CHEMICALS', city: 'Panoli', gstin: '24AAACK2345F1Z5', phone: '9825062345' },
    { id: newId(), name: 'RASAYANO INDUSTRIES LLP', city: 'Panoli', gstin: '24AAACR6789G1Z3', phone: '9825072345' },
    { id: newId(), name: 'Fluorescent Chemical Industries PVT LTD', city: 'Panoli', gstin: '24AAACF0123H1Z1', phone: '9825082345' },
    { id: newId(), name: 'YOGI FINE CHEM', city: 'Sanand', gstin: '24AAACY4567I1Z8', phone: '9825092345' },
    { id: newId(), name: 'KARAN INDUSTRIES', city: 'Sachin', gstin: '24AAACK8901J1Z6', phone: '9825102345' },
  ]

  const trucks = [
    { id: newId(), vehicleNumber: 'GJ15AV3219', type: 'Container', size: '32 ft', capacity: '16', owner: 'Own' },
    { id: newId(), vehicleNumber: 'GJ14Z8240', type: 'Open Body', size: '20 ft', capacity: '9', owner: 'Own' },
    { id: newId(), vehicleNumber: 'GJ16AY0643', type: 'Tanker', size: '—', capacity: '21', owner: 'Market' },
    { id: newId(), vehicleNumber: 'GJ23AT6466', type: 'Trailer', size: '40 ft', capacity: '25', owner: 'Market' },
    { id: newId(), vehicleNumber: 'GJ16AU9092', type: 'Container', size: '32 ft', capacity: '16', owner: 'Own' },
  ]

  const drivers = [
    { id: newId(), name: 'Ramesh Bhai', phone: '9724000001', license: 'GJ0120210001234' },
    { id: newId(), name: 'Suresh Patel', phone: '9724000002', license: 'GJ0120210005678' },
    { id: newId(), name: 'Mahesh Solanki', phone: '9724000003', license: 'GJ0120210009012' },
  ]

  write('parties', parties)
  write('trucks', trucks)
  write('drivers', drivers)
  write('suppliers', [
    { id: newId(), name: 'Shree Transport Suppliers', city: 'Ahmedabad', phone: '9825200001' },
  ])
  write('bilties', [])
  write('partyInvoices', [])
  write('lorryHires', [])
  localStorage.setItem(PREFIX + 'seeded', '1')
}
