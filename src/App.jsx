import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Sidebar from './components/Sidebar.jsx'
import Login from './pages/Login.jsx'
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
import ExpenseReport from './pages/ExpenseReport.jsx'
import Parties from './pages/Parties.jsx'
import Trucks from './pages/Trucks.jsx'
import Drivers from './pages/Drivers.jsx'
import Suppliers from './pages/Suppliers.jsx'
import Setup from './pages/Setup.jsx'
import Placeholder from './pages/Placeholder.jsx'

function AppRoutes() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <Routes>
          <Route path="/" element={<Navigate to="/bilty" replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/bilty" element={<ProtectedRoute><BiltyList /></ProtectedRoute>} />
          <Route path="/bilty/new" element={<ProtectedRoute><BiltyForm /></ProtectedRoute>} />
          <Route path="/bilty/:id/edit" element={<ProtectedRoute><BiltyForm /></ProtectedRoute>} />
          <Route path="/bilty/:id/print" element={<ProtectedRoute><BiltyPrint /></ProtectedRoute>} />
          <Route path="/party" element={<ProtectedRoute><Parties /></ProtectedRoute>} />
          <Route path="/supplier" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
          <Route path="/truck" element={<ProtectedRoute><Trucks /></ProtectedRoute>} />
          <Route path="/driver" element={<ProtectedRoute><Drivers /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute><Placeholder title="Tracking" /></ProtectedRoute>} />
          <Route path="/party-invoice" element={<ProtectedRoute><PartyInvoiceList /></ProtectedRoute>} />
          <Route path="/party-invoice/new" element={<ProtectedRoute><PartyInvoiceForm /></ProtectedRoute>} />
          <Route path="/party-invoice/:id" element={<ProtectedRoute><PartyInvoiceDetail /></ProtectedRoute>} />
          <Route path="/party-invoice/:id/edit" element={<ProtectedRoute><PartyInvoiceForm /></ProtectedRoute>} />
          <Route path="/party-invoice/:id/print" element={<ProtectedRoute><PartyInvoicePrint /></ProtectedRoute>} />
          <Route path="/party-invoice/:id/print-no-annex" element={<ProtectedRoute><PartyInvoicePrint /></ProtectedRoute>} />
          <Route path="/lorry-hire" element={<ProtectedRoute><LorryHireList /></ProtectedRoute>} />
          <Route path="/lorry-hire/new" element={<ProtectedRoute><LorryHireForm /></ProtectedRoute>} />
          <Route path="/lorry-hire/:id/edit" element={<ProtectedRoute><LorryHireForm /></ProtectedRoute>} />
          <Route path="/expense" element={<ProtectedRoute><ExpenseDashboard /></ProtectedRoute>} />
          <Route path="/expense/list" element={<ProtectedRoute><ExpenseList /></ProtectedRoute>} />
          <Route path="/expense/new" element={<ProtectedRoute><ExpenseForm /></ProtectedRoute>} />
          <Route path="/expense/:id/edit" element={<ProtectedRoute><ExpenseForm /></ProtectedRoute>} />
          <Route path="/expense/report/:period/:year/:month?" element={<ProtectedRoute><ExpenseReport /></ProtectedRoute>} />
          <Route path="/account-manager" element={<ProtectedRoute><Placeholder title="Account Manager" /></ProtectedRoute>} />
          <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/bilty" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppRoutes />} />
      </Routes>
    </AuthProvider>
  )
}
