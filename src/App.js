import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const App = () => {
  const [indices, setIndices] = useState([]);
  const [selectedIndexName, setSelectedIndexName] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [investment, setInvestment] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [savedPortfolios, setSavedPortfolios] = useState([]);

  const fetchIndexWithInvestment = async (indexName, amount) => {
    try {
      setLoading(true);
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/indices/${indexName}?amount=${amount}`);
      setSelectedIndex(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching selected index:', err);
      setLoading(false);
    }
  };

  const fetchIndicesList = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/indices`);
      setIndices(res.data);
      if (res.data.length > 0) {
        setSelectedIndexName(res.data[0].name);
        fetchIndexWithInvestment(res.data[0].name, investment);
      }
    } catch (err) {
      console.error('Error fetching indices list:', err);
    }
  };

  useEffect(() => {
    fetchIndicesList();
  }, []);

  useEffect(() => {
    if (selectedIndexName) {
      fetchIndexWithInvestment(selectedIndexName, investment);
    }
  }, [investment, selectedIndexName]);

  const handlePurchase = () => {
    if (selectedIndex) {
      setSavedPortfolios(prev => [...prev, {
        name: selectedIndex.name,
        date: new Date().toLocaleString(),
        investment,
        data: selectedIndex.constituents.map(s => ({
          ...s,
          purchasePrice: s.price
        }))
      }]);
    }
  };

  const totalInvested = selectedIndex
    ? selectedIndex.constituents.reduce((sum, s) => sum + s.allocatedAmount, 0)
    : 0;

  const toWords = (num) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  };

  const numberToWords = (num) => {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

    const convert = (n) => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? '-' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
      return convert(Math.floor(n / 100000)) + ' lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
    };

    return convert(num);
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#8dd1e1', '#d0ed57', '#a4de6c', '#d88884', '#a28dd1', '#84a1d8'];

  const renderCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow text-sm">
          <strong>{payload[0].name}</strong>: {toWords(payload[0].value)}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
		<img src="/diy-index-logo.png" alt="DIY Index Logo" className="w-24 h-24" />
		<span className="text-2xl font-bold text-green-600">DIY Index</span>
	  </div>


      <div className="flex flex-wrap items-center gap-4 mb-0">
        <div className="flex items-center gap-2">
          <label className="font-medium">Select Index:</label>
          <select
            className="p-2 border rounded-md shadow-sm"
            value={selectedIndexName}
            onChange={(e) => setSelectedIndexName(e.target.value)}
          >
            <option value="">-- Choose an index --</option>
            {indices.map((index) => (
              <option key={index.name} value={index.name}>{index.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="font-medium">Investment (₹):</label>
          <input
            type="number"
            className="p-2 border rounded-md shadow-sm w-40"
            value={investment}
            onChange={(e) => setInvestment(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="text-sm text-gray-700 mt-1 mb-4 ml-[180px] italic">
        {toWords(investment)} ({numberToWords(investment)} only)
      </div>

      {loading && <p className="text-center text-gray-600">Loading data...</p>}

      {!loading && selectedIndex && (
        <>
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full border border-gray-300 shadow-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Stock</th>
                  <th className="border p-2 text-right">Weight (%)</th>
                  <th className="border p-2 text-right">Price (₹)</th>
                  <th className="border p-2 text-right">Shares</th>
                  <th className="border p-2 text-right">Allocated (₹)</th>
                </tr>
              </thead>
              <tbody>
                {selectedIndex.constituents.map((row) => (
                  <tr key={row.symbol} className="hover:bg-gray-50">
                    <td className="border p-2 text-left">{row.name}</td>
                    <td className="border p-2 text-right">{row.weight.toFixed(2)}%</td>
                    <td className="border p-2 text-right">{toWords(row.price)}</td>
                    <td className="border p-2 text-right">{row.shares}</td>
                    <td className="border p-2 text-right">{toWords(row.allocatedAmount)}</td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-100">
                  <td className="border p-2 text-left" colSpan="4">Total</td>
                  <td className="border p-2 text-right">{toWords(totalInvested)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={selectedIndex.constituents.map(s => ({ name: s.name, value: s.allocatedAmount }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, value }) => `${name}: ₹${value.toLocaleString('en-IN')}`}
                  dataKey="value"
                >
                  {selectedIndex.constituents.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={renderCustomTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {savedPortfolios.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Saved Portfolios</h2>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {savedPortfolios.map((p, idx) => (
              <li key={idx}>
                {p.name} — ₹{p.investment.toLocaleString('en-IN')} on {p.date}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;