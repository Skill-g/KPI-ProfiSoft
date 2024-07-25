import { SERVER_URL } from '@/app/consts';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './style.module.css';

export interface UserName {
    userId: string;
    userName: string;
}

export interface FilteredUser {
    name: string;
    code: string;
}

const Home = () => {
    const [SelectedUser, setSelectedUser] = useState('');
    const [FilteredUsers, setFilteredCities] = useState<FilteredUser[]>([]);
    const [isMonthYearPickerOpen, setIsMonthYearPickerOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [userNames, setUserNames] = useState<UserName[]>([]);

    const navigate = useNavigate();

    const capitalizeFirstLetter = (string: string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    const currentMonth = capitalizeFirstLetter(new Date().toLocaleString('default', { month: 'long' }));
    const currentYear = new Date().getFullYear().toString();

    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const months = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];

    const monthsMap: { [key: string]: number } = {
        Январь: 1, Февраль: 2, Март: 3, Апрель: 4, Май: 5, Июнь: 6,
        Июль: 7, Август: 8, Сентябрь: 9, Октябрь: 10, Ноябрь: 11, Декабрь: 12
    };

    const years = Array.from(new Array(50), (_val, index) => (new Date().getFullYear() - index).toString());

    const dropdownRef = useRef<HTMLDivElement>(null);
    const monthYearPickerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const storedUserId = Cookies.get('userId');
        const storedMonth = Cookies.get('selectedMonth');
        const storedYear = Cookies.get('selectedYear');

        if (storedUserId) {
            const user = userNames.find(u => u.userId === storedUserId);
            if (user) {
                setSelectedUser(user.userName);
            }
        }
        if (storedMonth) setSelectedMonth(decodeURIComponent(storedMonth));
        if (storedYear) setSelectedYear(decodeURIComponent(storedYear));

        const fetchUserNames = async () => {
            try {
                const response = await axios.get(`${SERVER_URL}/getUserNames`);
                const users: UserName[] = response.data.userNames;

                const formattedUsers: FilteredUser[] = users.map(user => ({
                    name: user.userName,
                    code: user.userId
                }));

                setUserNames(users);
                setFilteredCities(formattedUsers);
            } catch (error) {
                console.error('Error fetching usernames:', error);
            }
        };

        fetchUserNames();
    }, []);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [FilteredUsers]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSelectedUser(value);

        if (value.trim() === '') {
            setFilteredCities([]);
        } else {
            const filtered = userNames
                .filter(employer => employer.userName.toLowerCase().includes(value.toLowerCase()))
                .map(user => ({ name: user.userName, code: user.userId }));

            setFilteredCities(filtered.slice(0, 3));
        }

        setActiveIndex(null);
    };

    const handleCitySelect = (city: FilteredUser) => {
        setSelectedUser(city.name);
        setFilteredCities([]);
        Cookies.set('userId', city.code, { expires: 7 });
    };

    const handleMonthYearPickerToggle = () => {
        setIsMonthYearPickerOpen(!isMonthYearPickerOpen);
    };

    const handleMonthSelect = (month: string) => {
        setSelectedMonth(month);
        setIsMonthYearPickerOpen(false);
        Cookies.set('selectedMonth', encodeURIComponent(month), { expires: 7 });
    };

    const handleYearSelect = (year: string) => {
        setSelectedYear(year);
        Cookies.set('selectedYear', encodeURIComponent(year), { expires: 7 });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (FilteredUsers.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                setActiveIndex(prev => (prev === null ? 0 : (prev + 1) % FilteredUsers.length));
                e.preventDefault();
                break;
            case 'ArrowUp':
                setActiveIndex(prev => (prev === null ? FilteredUsers.length - 1 : (prev - 1 + FilteredUsers.length) % FilteredUsers.length));
                e.preventDefault();
                break;
            case 'Enter':
                if (activeIndex !== null) {
                    handleCitySelect(FilteredUsers[activeIndex]);
                }
                e.preventDefault();
                break;
            default:
                break;
        }
    };

    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setFilteredCities([]);
        }
        if (monthYearPickerRef.current && !monthYearPickerRef.current.contains(event.target as Node)) {
            setIsMonthYearPickerOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const monthNumber = monthsMap[selectedMonth];
        if (!monthNumber) {
            console.error('Invalid month selected');
            return;
        }

        const formattedMonthYear = `${selectedYear}-${monthNumber.toString().padStart(2, '0')}`;

        Cookies.set('selectedMonthYear', encodeURIComponent(formattedMonthYear), { expires: 7 });
        navigate('/kpi');
    };

    return (
        <div className="container-kpi">
            <div className={styles.container}>
                <div className={styles.authLogin}>
                    <div className={styles.cart}>
                        <form className={styles.formReg} onSubmit={handleSubmit}>
                            <div className={styles.formRegHeader}>
                                <p className={styles.formTextLogo}>ProfiSoft - KPI</p>
                            </div>
                            <div className={styles.formRegBody}>
                                <div className={styles.formRegBodyLogin}>
                                    <div className={styles.dropdown} ref={dropdownRef}>
                                        <input
                                            type="text"
                                            value={SelectedUser}
                                            onChange={handleInputChange}
                                            onKeyDown={handleKeyDown}
                                            className={styles.dropdownInput}
                                            placeholder="Выберите пользователя"
                                            ref={inputRef}
                                        />
                                        {SelectedUser.trim() !== '' && FilteredUsers.length > 0 && (
                                            <ul className={styles.dropdownList}>
                                                {FilteredUsers.map((city, index) => (
                                                    <li
                                                        key={city.code}
                                                        onClick={() => handleCitySelect(city)}
                                                        className={`${styles.dropdownListItem} ${index === activeIndex ? styles.activeItem : ''}`}
                                                    >
                                                        {city.name}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div className={styles.monthYearPicker} ref={monthYearPickerRef}>
                                        <input
                                            type="text"
                                            value={`${selectedMonth} ${selectedYear}`}
                                            onClick={handleMonthYearPickerToggle}
                                            className={styles.dropdownInput}
                                            readOnly
                                            placeholder="Выберите месяц и год"
                                        />
                                        {isMonthYearPickerOpen && (
                                            <div className={styles.monthYearPickerDropdown}>
                                                <div className={styles.months}>
                                                    {months.map(month => (
                                                        <div
                                                            key={month}
                                                            className={styles.dropdownListItem}
                                                            onClick={() => handleMonthSelect(month)}
                                                        >
                                                            {month}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className={styles.years}>
                                                    {years.map(year => (
                                                        <div
                                                            key={year}
                                                            className={styles.dropdownListItem}
                                                            onClick={() => handleYearSelect(year)}
                                                        >
                                                            {year}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button type="submit">Войти</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;
