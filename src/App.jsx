import { Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Dashboard from './pages/Dashboard.jsx'
import BiltyList from './pages/BiltyList.jsx'
import BiltyForm from './pages/BiltyForm.jsx'
import BiltyPrint from './pages/BiltyPrint.jsx'
import PartyInvoiceList from './pages/PartyInvoiceList.jsx'
import PartyInvoiceForm from './pages/PartyInvoiceForm.jsx'
import PartyInvoiceDetail from './pages/PartyInvoiceDetail.jsx'
import PartyInvoicePrint from './pages/PartyInvoicePrint.jsx'
import LorryHireList from './pages/LorryHireList.jsx'
import LorryHireForm from './pages/LorryHireForm.jsx'
import ExpenseDashboard from './pages/ExpenseDashboard.jsx'
import ExpenseList from './pages/ExpenseList.jsx'
import ExpenseForm from './pages/ExpenseForm.jsx'
import Parties from './pages/Parties.jsx'
import Trucks from './pages/Trucks.jsx'
import Drivers from './pages/Drivers.jsx'
import Suppliers from './pages/Suppliers.jsx'
import Placeholder from './pages/Placeholder.jsx'

export default function App() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/bilty" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bilty" element={<BiltyList />} />
          <Route path="/bilty/new" element={<BiltyForm />} />
          <Route path="/bilty/:id/edit" element={<BiltyForm />} />
          <Route path="/bilty/:id/print" element={<BiltyPrint />} />
          <Route path="/party" element={<Parties />} />
          <Route path="/supplier" element={<Suppliers />} />
          <Route path="/truck" element={<Trucks />} />
          <Route path="/driver" element={<Drivers />} />
          <Route path="/tracking" element={<Placeholder title="Tracking" />} />
          <Route path="/party-invoice" element={<PartyInvoiceList />} />
          <Route path="/party-invoice/new" element={<PartyInvoiceForm />} />
          <Route path="/party-invoice/:id" element={<PartyInvoiceDetail />} />
          <Route path="/party-invoice/:id/edit" element={<PartyInvoiceForm />} />
          <Route path="/party-invoice/:id/print" element={<PartyInvoicePrint />} />
          <Route path="/party-invoice/:id/print-no-annex" element={<PartyInvoicePrint />} />
          <Route path="/lorry-hire" element={<LorryHireList />} />
          <Route path="/lorry-hire/new" element={<LorryHireForm />} />
          <Route path="/lorry-hire/:id/edit" element={<LorryHireForm />} />
          <Route path="/expense" element={<ExpenseDashboard />} />
          <Route path="/expense/list" element={<ExpenseList />} />
          <Route path="/expense/new" element={<ExpenseForm />} />
          <Route path="/expense/:id/edit" element={<ExpenseForm />} />
          <Route path="/account-manager" element={<Placeholder title="Account Manager" />} />
          <Route path="/setup" element={<Placeholder title="Setup" />} />
          <Route path="*" element={<Navigate to="/bilty" replace />} />
        </Routes>
      </div>
    </div>
  )
}
