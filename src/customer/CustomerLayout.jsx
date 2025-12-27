import { Outlet, useOutletContext } from 'react-router-dom';

function CustomerLayout() {
  // Terima context dari parent (CustomerDashboard)
  const context = useOutletContext();
  
  return (
    <div className="w-full h-full overflow-x-hidden">
      {/* Pass context ke child components */}
      <Outlet context={context} />
    </div>
  );
}

export default CustomerLayout;