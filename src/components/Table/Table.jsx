import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Table() {
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchCustomer, setSearchCustomer] = useState('');
  const [searchAmount, setSearchAmount] = useState('');
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    const fetchCustomersAndTransactions = async () => {
      try {
        const response = await fetch('https://omarbassuony.github.io/Data-Viewer/db.json');
        const result = await response.json();
        setCustomers(result.customers);
        setTransactions(result.transactions);
        setFilteredTransactions(result.transactions);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchCustomersAndTransactions();
  }, []);

  useEffect(() => {
    filterTransactions(searchCustomer, searchAmount);
  }, [searchCustomer, searchAmount, transactions]);

  useEffect(() => {
    if (selectedCustomer) {
      const dataByDay = {};
      filteredTransactions.forEach(transaction => {
        if (transaction.customer_id === selectedCustomer.id) {
          const date = transaction.date.split('T')[0];
          const amount = parseFloat(transaction.amount);
          if (!dataByDay[date]) {
            dataByDay[date] = amount;
          } else {
            dataByDay[date] += amount;
          }
        }
      });

      const labels = Object.keys(dataByDay);
      const data = Object.values(dataByDay);

      setChartData({
        labels: labels,
        datasets: [
          {
            label: `Total Amount for ${selectedCustomer.name}`,
            data: data,
            fill: false,
            borderColor: 'rgb(37 ,99, 235)',
            tension: 0.1,
          },
        ],
      });
    } else {
      setChartData({});
    }
  }, [filteredTransactions, selectedCustomer]);

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
  };

  const handleCustomerSearch = (event) => {
    setSearchCustomer(event.target.value.toLowerCase());
  };

  const handleAmountSearch = (event) => {
    setSearchAmount(event.target.value.trim());
  };

  const filterTransactions = (customerName, amount) => {
    const filtered = transactions.filter(transaction => {
      const customer = customers.find(cust => cust.id === transaction.customer_id);
      const matchCustomer = customerName === '' || (customer && customer.name.toLowerCase().includes(customerName));
      const matchAmount = amount === '' || parseFloat(transaction.amount).toString().startsWith(parseFloat(amount).toString());
      return matchCustomer && matchAmount;
    });
    setFilteredTransactions(filtered);
  };

  const filteredCustomers = customers.filter(customer => {
    const customerTransactions = filteredTransactions.filter(transaction => transaction.customer_id === customer.id);
    return (
      searchCustomer === '' || customer.name.toLowerCase().includes(searchCustomer)
    ) && (
      searchAmount === '' || customerTransactions.some(transaction => parseFloat(transaction.amount).toString().startsWith(parseFloat(searchAmount).toString()))
    );
  });

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4 flex space-x-4 justify-center">
        <input
          type="text"
          placeholder="Search by name"
          className="py-2 px-4 border border-gray-300 rounded-md focus:border-blue-700 focus:border-2 outline-none"
          value={searchCustomer}
          onChange={handleCustomerSearch}
        />
        <input
          type="text"
          placeholder="Search by amount"
          className="py-2 px-4 border border-gray-300 rounded-md focus:border-blue-700 focus:border-2 outline-none"
          value={searchAmount}
          onChange={handleAmountSearch}
        />
      </div>

      <table className="min-w-full bg-white mb-4">
        <thead>
          <tr>
            <th className="py-2 px-4 border-b border-gray-200">Customer Name</th>
            <th className="py-2 px-4 border-b border-gray-200">Amount</th>
            <th className="py-2 px-4 border-b border-gray-200">Date</th>
            <th className="py-2 px-4 border-b border-gray-200">Select</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map(customer => {
            const customerTransactions = filteredTransactions.filter(transaction => transaction.customer_id === customer.id);
            return (
              <tr key={customer.id}>
                <td className="py-2 px-4 border-b border-gray-200">{customer.name}</td>
                <td className="py-2 px-4 border-b border-gray-200">
                  {customerTransactions.map(transaction => (
                    <div key={transaction.id}>{transaction.amount}</div>
                  ))}
                </td>
                <td className="py-2 px-4 border-b border-gray-200">
                  {customerTransactions.map(transaction => (
                    <div key={transaction.id}>{transaction.date.split('T')[0]}</div>
                  ))}
                </td>
                <td className="py-2 px-4 border-b border-gray-200">
                  <input
                    type="radio"
                    name="customer"
                    value={customer.id}
                    checked={selectedCustomer && selectedCustomer.id === customer.id}
                    onChange={() => handleCustomerSelect(customer)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {selectedCustomer ? (
        <>
          <h2 className="text-lg font-bold mb-2">{`Total Transaction Amount per Day for ${selectedCustomer.name}`}</h2>
          {Object.keys(chartData).length > 0 ? (
            <Line data={chartData} />
          ) : (
            <p>No data available for {selectedCustomer.name}</p>
          )}
        </>
      ) : (
        <p className="text-red-500 my-12 text-2xl">Select a customer to show their chart.</p>
      )}
    </div>
  );
}