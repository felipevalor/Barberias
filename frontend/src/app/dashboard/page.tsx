export default function DashboardIndex() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
            <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">Panel Principal</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Desde aquí podrás gestionar tu barbería. Selecciona una opción en el menú lateral para comenzar a configurar tu staff, servicios y agenda.
            </p>
        </div>
    );
}
