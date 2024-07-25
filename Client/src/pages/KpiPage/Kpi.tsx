import { SERVER_URL } from '@/app/consts';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { AnimatePresence, motion } from 'framer-motion';
import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';

interface Task {
    id: string;
    taskName: string;
    time: string;
    plannedTime: string;
}

const Kpi = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isTotalModalOpen, setIsTotalModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [totalTime, setTotalTime] = useState(0);
    const [totalHours, setTotalHours] = useState(0);
    const [salary, setSalary] = useState(Cookies.get('salary') || '');
    const [hourlyRate, setHourlyRate] = useState(Cookies.get('hourlyRate') || '');
    const [totalAmount, setTotalAmount] = useState(0);
    const [tasks, setTasks] = useState<Task[]>([]);

    const filteredTasks = tasks.filter(task =>
        task.taskName && task.taskName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCalculateTotal = () => {
        const taskCount = filteredTasks.length;
        const totalHoursValue = filteredTasks.reduce((acc, task) => acc + parseFloat(task.time), 0);
        const salaryAmount = parseFloat(salary) || 0;
        const hourlyRateAmount = parseFloat(hourlyRate) || 1000;
        const totalEarnings = salaryAmount + totalHoursValue * hourlyRateAmount;

        setTotalTime(taskCount);
        setTotalHours(Number(totalHoursValue.toFixed(2)));
        setTotalAmount(Math.floor(totalEarnings));
        setIsTotalModalOpen(true);
    };

    const handleDownloadExcel = async () => {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('KPI');

        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Название задачи', key: 'name', width: 52 },
            { header: 'Время', key: 'time', width: 15 },
            { header: 'Плановое время', key: 'planned_time', width: 15 }
        ];

        const processedTasks = tasks.map(task => ({
            id: parseInt(task.id, 10),
            name: task.taskName,
            time: parseFloat(task.time),
            planned_time: parseFloat(task.plannedTime)
        })).filter(task =>
            task.name && task.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        processedTasks.forEach(task => worksheet.addRow(task));

        worksheet.addRow({});
        worksheet.addRow({ name: 'Общее время:', time: { formula: `SUM(C2:C${processedTasks.length + 1})` } });

        const salaryAmount = parseFloat(salary) || 0;
        const hourlyRateAmount = parseFloat(hourlyRate) || 1000;
        worksheet.addRow({});
        worksheet.addRow({ name: 'Общая сумма:', time: { formula: `${salaryAmount} + SUM(C2:C${processedTasks.length + 1}) * ${hourlyRateAmount}` } });

        const buffer = await workbook.xlsx.writeBuffer();
        const fileName = `KPI_${Math.random().toString(36).substring(2, 15)}.xlsx`;
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, fileName);
    };

    const fetchTasks = async () => {
        const selectedMonthYear = Cookies.get('selectedMonthYear');
        const userId = Cookies.get('userId');

        if (!selectedMonthYear || !userId) {
            console.error('Не удалось получить параметры из cookies');
            return;
        }

        try {
            const response = await axios.get(`${SERVER_URL}/getTableUsers`, {
                params: {
                    month: selectedMonthYear,
                    user_id: userId,
                },
            });
            const data = response.data;
            const filteredData = data.filter((task: { id: string; }) => task.id !== "Проектные часы");
            setTasks(filteredData);
        } catch (error) {
            console.error('Ошибка при получении данных:', error);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleSaveSettings = () => {
        Cookies.set('salary', salary);
        Cookies.set('hourlyRate', hourlyRate);
        setIsSettingsModalOpen(false);
        alert('Настройки сохранены');
    };

    return (
        <div className="container-kpi h-screen">
            <div className="table-kpi relative shadow-md sm:rounded-lg w-11/12 justify-center items-center flex flex-col m-auto pt-8">
                <div className="rounded-tr-2xl rounded-tl-2xl flex items-center justify-between flex-column md:flex-row flex-wrap space-y-4 md:space-y-0 py-4 bg-white dark:bg-gray-900 w-full">
                    <div className="pl-4 flex">
                        <Menu as="div" className="relative inline-block text-left">
                            <div className='flex'>
                                <MenuButton className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                                    Действия
                                    <ChevronDownIcon aria-hidden="true" className="-mr-1 h-5 w-5 text-gray-400" />
                                </MenuButton>
                            
                            </div>
                            <MenuItems
                                transition
                                className="absolute right-0 z-50 mt-2 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 transition focus:outline-none data-[closed]:scale-95 data-[closed]:transform data-[closed]:opacity-0 data-[enter]:duration-100 data-[leave]:duration-75 data-[enter]:ease-out data-[leave]:ease-in w-24"
                            >
                                <div className="py-1">
                                    <MenuItem>
                                        <a
                                            href="#"
                                            onClick={() => setIsSettingsModalOpen(true)}
                                            className="block px-4 py-2 text-sm text-gray-700 text-center data-[focus]:bg-gray-100 data-[focus]:text-gray-900"
                                        >
                                            Настройки KPI
                                        </a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a
                                            href="#"
                                            onClick={handleDownloadExcel}
                                            className="block px-4 py-2 text-sm text-gray-700 text-center data-[focus]:bg-gray-100 data-[focus]:text-gray-900"
                                        >
                                            Скачать в XLSX
                                        </a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a
                                            href="#"
                                            onClick={handleCalculateTotal}
                                            className="block px-4 py-2 text-sm text-gray-700 text-center data-[focus]:bg-gray-100 data-[focus]:text-gray-900"
                                        >
                                            Подсчитать итоги
                                        </a>
                                    </MenuItem>
                                    <MenuItem>
                                        <a
                                            href="#"
                                            className="block px-4 py-2 text-sm text-gray-700 text-center data-[focus]:bg-gray-100 data-[focus]:text-gray-900"
                                        >
                                            Отправить KPI
                                        </a>
                                    </MenuItem>
                                </div>
                            </MenuItems>
                        </Menu>
                        <button className='ml-5 inline-flex w-full justify-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 button-table-project'>Проектная таблица</button>

                    </div>
                    <label htmlFor="table-search" className="sr-only">Search</label>
                    <div className="relative pr-4">
                        <div className="absolute inset-y-0 rtl:inset-r-0 start-0 flex items-center ps-3 pointer-events-none">
                        </div>
                        <input
                            type="text"
                            id="table-search"
                            className="input-search block p-2.5 w-80 text-sm text-gray-900 dark:text-white border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Поиск по задаче"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-5 w-full">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-3">ID</th>
                                <th scope="col" className="px-6 py-3">Название задачи</th>
                                <th scope="col" className="px-6 py-3">Время</th>
                                <th scope="col" className="px-6 py-3">Плановое время</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTasks.map((task, index) => (
                                <tr key={index} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                                    <td className="px-6 py-4">{task.id}</td>
                                    <td className="px-6 py-4">{task.taskName}</td>
                                    <td className="px-6 py-4">{task.time}</td>
                                    <td className="px-6 py-4">{task.plannedTime}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <AnimatePresence>
                {isTotalModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50"
                    >
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h2 className="text-lg font-bold mb-4">Итоги</h2>
                            <p>Количество задач: {totalTime}</p>
                            <p>Общее время: {totalHours} часов</p>
                            <p>Общая сумма: {totalAmount} тенге</p>
                            <button
                                onClick={() => setIsTotalModalOpen(false)}
                                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Закрыть
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {isSettingsModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50"
                    >
                        <div className="bg-white p-6 rounded-lg shadow-lg">
                            <h2 className="text-lg font-bold mb-4">Настройки KPI</h2>
                            <div className="mb-4">
                                <label htmlFor="salary" className="block text-sm font-medium text-gray-700">Оклад:</label>
                                <input
                                    type="number"
                                    id="salary"
                                    value={salary}
                                    onChange={(e) => setSalary(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div className="mb-4">
                                <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">Почасовая ставка:</label>
                                <input
                                    type="number"
                                    id="hourlyRate"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(e.target.value)}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>
                            <button
                                onClick={handleSaveSettings}
                                className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Сохранить
                            </button>
                            <button
                                onClick={() => setIsSettingsModalOpen(false)}
                                className="mt-4 ml-4 bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                            >
                                Отмена
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Kpi;
