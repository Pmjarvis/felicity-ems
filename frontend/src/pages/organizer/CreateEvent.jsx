import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    type: 'Normal',
    isTeamEvent: false,
    minTeamSize: 2,
    maxTeamSize: 4,
    eligibility: 'All',
    venue: '',
    registrationDeadline: '',
    startDate: '',
    endDate: '',
    registrationLimit: '',
    registrationFee: 0,
    tags: [],
    customForm: [],
    merchandise: {
      variants: [],
      stockQuantity: 0,
      purchaseLimit: 1
    }
  });

  const [currentTag, setCurrentTag] = useState('');
  const [currentField, setCurrentField] = useState({
    label: '',
    fieldType: 'text',
    required: false,
    options: []
  });
  const [currentOption, setCurrentOption] = useState('');
  const [currentVariant, setCurrentVariant] = useState({ name: '', price: 0, stock: 0 });
  const [currentColor, setCurrentColor] = useState('');
  const [selectedSizes, setSelectedSizes] = useState([]);
  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEventData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const addTag = () => {
    if (currentTag.trim() && !eventData.tags.includes(currentTag.trim())) {
      setEventData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove) => {
    setEventData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addCustomField = () => {
    if (currentField.label.trim()) {
      setEventData(prev => ({
        ...prev,
        customForm: [...prev.customForm, { ...currentField }]
      }));
      setCurrentField({
        label: '',
        fieldType: 'text',
        required: false,
        options: []
      });
    }
  };

  const removeCustomField = (index) => {
    setEventData(prev => ({
      ...prev,
      customForm: prev.customForm.filter((_, i) => i !== index)
    }));
  };

  const moveCustomField = (index, direction) => {
    setEventData(prev => {
      const fields = [...prev.customForm];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= fields.length) return prev;
      [fields[index], fields[newIndex]] = [fields[newIndex], fields[index]];
      return { ...prev, customForm: fields };
    });
  };

  const addOption = () => {
    if (currentOption.trim()) {
      setCurrentField(prev => ({
        ...prev,
        options: [...prev.options, currentOption.trim()]
      }));
      setCurrentOption('');
    }
  };

  const removeOption = (idx) => {
    setCurrentField(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== idx)
    }));
  };

  const addVariant = () => {
    if (currentVariant.name.trim()) {
      setEventData(prev => ({
        ...prev,
        merchandise: {
          ...prev.merchandise,
          variants: [...prev.merchandise.variants, { ...currentVariant }]
        }
      }));
      setCurrentVariant({ name: '', price: 0, stock: 0 });
    }
  };

  const removeVariant = (idx) => {
    setEventData(prev => ({
      ...prev,
      merchandise: {
        ...prev.merchandise,
        variants: prev.merchandise.variants.filter((_, i) => i !== idx)
      }
    }));
  };

  const addColor = () => {
    if (currentColor.trim() && !eventData.merchandise.colors?.includes(currentColor.trim())) {
      setEventData(prev => ({
        ...prev,
        merchandise: {
          ...prev.merchandise,
          colors: [...(prev.merchandise.colors || []), currentColor.trim()]
        }
      }));
      setCurrentColor('');
    }
  };

  const removeColor = (color) => {
    setEventData(prev => ({
      ...prev,
      merchandise: {
        ...prev.merchandise,
        colors: (prev.merchandise.colors || []).filter(c => c !== color)
      }
    }));
  };

  const toggleSize = (size) => {
    setSelectedSizes(prev => {
      const next = prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size];
      setEventData(p => ({
        ...p,
        merchandise: { ...p.merchandise, sizes: next }
      }));
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/events', eventData);
      alert('Event created successfully as draft!');
      navigate('/organizer/events');
    } catch (error) {
      console.error('Error creating event:', error);
      setError(error.response?.data?.message || 'Failed to create event');
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Basic Information</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Event Name *
        </label>
        <input
          type="text"
          name="name"
          value={eventData.name}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description *
        </label>
        <textarea
          name="description"
          value={eventData.description}
          onChange={handleInputChange}
          rows="4"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Event Type *
        </label>
        <select
          name="type"
          value={eventData.type}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="Normal">Normal Event</option>
          <option value="Merchandise">Merchandise</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Eligibility
          </label>
          <select
            name="eligibility"
            value={eventData.eligibility}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Participants</option>
            <option value="IIIT Only">IIIT Students Only</option>
            <option value="Non-IIIT Only">Non-IIIT Participants Only</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Venue
          </label>
          <input
            type="text"
            name="venue"
            value={eventData.venue}
            onChange={handleInputChange}
            placeholder="e.g., Himalaya Hall, IIIT-H"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="isTeamEvent"
            name="isTeamEvent"
            checked={eventData.isTeamEvent}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isTeamEvent" className="text-sm font-medium text-gray-700">
            🏆 This is a Team Event (Hackathon/Competition)
          </label>
        </div>
      </div>

      {eventData.isTeamEvent && (
        <div className="grid grid-cols-2 gap-4 bg-blue-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Team Size *
            </label>
            <input
              type="number"
              name="minTeamSize"
              value={eventData.minTeamSize}
              onChange={handleInputChange}
              min="2"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Team Size *
            </label>
            <input
              type="number"
              name="maxTeamSize"
              value={eventData.maxTeamSize}
              onChange={handleInputChange}
              min={eventData.minTeamSize}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Next →
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Event Details</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration Deadline *
          </label>
          <input
            type="datetime-local"
            name="registrationDeadline"
            value={eventData.registrationDeadline}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event Start Date *
          </label>
          <input
            type="datetime-local"
            name="startDate"
            value={eventData.startDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Event End Date *
          </label>
          <input
            type="datetime-local"
            name="endDate"
            value={eventData.endDate}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration Limit (Leave empty for unlimited)
          </label>
          <input
            type="number"
            name="registrationLimit"
            value={eventData.registrationLimit}
            onChange={handleInputChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration Fee (₹)
          </label>
          <input
            type="number"
            name="registrationFee"
            value={eventData.registrationFee}
            onChange={handleInputChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={currentTag}
            onChange={(e) => setCurrentTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            placeholder="Add a tag..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {eventData.tags.map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Merchandise Fields - only shown when type is Merchandise */}
      {eventData.type === 'Merchandise' && (
        <div className="border-t pt-6 space-y-6">
          <h4 className="text-lg font-semibold text-gray-800">🛍️ Merchandise Details</h4>

          {/* Stock & Purchase Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Stock Quantity *</label>
              <input
                type="number"
                value={eventData.merchandise.stockQuantity}
                onChange={(e) => setEventData(prev => ({
                  ...prev,
                  merchandise: { ...prev.merchandise, stockQuantity: parseInt(e.target.value) || 0 }
                }))}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Limit per Person</label>
              <input
                type="number"
                value={eventData.merchandise.purchaseLimit}
                onChange={(e) => setEventData(prev => ({
                  ...prev,
                  merchandise: { ...prev.merchandise, purchaseLimit: parseInt(e.target.value) || 1 }
                }))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Sizes</label>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                    selectedSizes.includes(size)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Available Colors</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={currentColor}
                onChange={(e) => setCurrentColor(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                placeholder="e.g., Red, Blue, Black"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="button" onClick={addColor} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(eventData.merchandise.colors || []).map((color, i) => (
                <span key={i} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-2">
                  {color}
                  <button type="button" onClick={() => removeColor(color)} className="text-purple-600 hover:text-purple-800">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Variants (optional)</label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={currentVariant.name}
                onChange={(e) => setCurrentVariant(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Variant name"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                value={currentVariant.price}
                onChange={(e) => setCurrentVariant(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                placeholder="Price"
                min="0"
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={currentVariant.stock}
                  onChange={(e) => setCurrentVariant(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  placeholder="Stock"
                  min="0"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={addVariant} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">+</button>
              </div>
            </div>
            {eventData.merchandise.variants.length > 0 && (
              <div className="mt-2 space-y-1">
                {eventData.merchandise.variants.map((v, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded text-sm">
                    <span>{v.name} — ₹{v.price} (Stock: {v.stock})</span>
                    <button type="button" onClick={() => removeVariant(i)} className="text-red-600 hover:text-red-800">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => setStep(3)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Next →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Custom Registration Form (Optional)</h3>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600 mb-4">
          Add custom fields to collect additional information from participants
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Label
            </label>
            <input
              type="text"
              value={currentField.label}
              onChange={(e) => setCurrentField({ ...currentField, label: e.target.value })}
              placeholder="e.g., T-Shirt Size"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Type
            </label>
            <select
              value={currentField.fieldType}
              onChange={(e) => setCurrentField({ ...currentField, fieldType: e.target.value, options: [] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="number">Number</option>
              <option value="textarea">Long Text</option>
              <option value="select">Dropdown</option>
              <option value="checkbox">Checkbox</option>
              <option value="file">File Upload</option>
            </select>
          </div>
        </div>

        {/* Dropdown Options Editor */}
        {currentField.fieldType === 'select' && (
          <div className="mt-3 bg-white p-3 rounded border border-blue-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dropdown Options</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={currentOption}
                onChange={(e) => setCurrentOption(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                placeholder="Add an option..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button type="button" onClick={addOption} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {currentField.options.map((opt, i) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1">
                  {opt}
                  <button type="button" onClick={() => removeOption(i)} className="text-blue-600 hover:text-blue-800 font-bold">×</button>
                </span>
              ))}
            </div>
            {currentField.options.length === 0 && (
              <p className="text-xs text-gray-500 italic mt-1">Add at least two options for the dropdown</p>
            )}
          </div>
        )}
        
        <div className="mt-3 flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={currentField.required}
              onChange={(e) => setCurrentField({ ...currentField, required: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Required field</span>
          </label>
          <button
            type="button"
            onClick={addCustomField}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            + Add Field
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-gray-700">Form Preview:</h4>
        {eventData.customForm.length === 0 ? (
          <p className="text-sm text-gray-500 italic">No custom fields added yet</p>
        ) : (
          eventData.customForm.map((field, index) => (
            <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
              <div>
                <span className="font-medium">{field.label}</span>
                <span className="text-sm text-gray-500 ml-2">({field.fieldType})</span>
                {field.required && (
                  <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded ml-2">Required</span>
                )}
                {field.fieldType === 'select' && field.options.length > 0 && (
                  <span className="text-xs text-gray-500 ml-2">[{field.options.join(', ')}]</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moveCustomField(index, -1)}
                  disabled={index === 0}
                  className="text-gray-500 hover:text-gray-800 disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveCustomField(index, 1)}
                  disabled={index === eventData.customForm.length - 1}
                  className="text-gray-500 hover:text-gray-800 disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeCustomField(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep(2)}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => setStep(4)}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Review →
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Review & Create</h3>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="font-semibold text-gray-700">Event Name:</h4>
          <p>{eventData.name}</p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-700">Type:</h4>
          <p>{eventData.type} {eventData.isTeamEvent && '(Team Event)'}</p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-700">Registration Fee:</h4>
          <p>₹{eventData.registrationFee}</p>
        </div>
        
        <div>
          <h4 className="font-semibold text-gray-700">Dates:</h4>
          <p>Deadline: {new Date(eventData.registrationDeadline).toLocaleString()}</p>
          <p>Start: {new Date(eventData.startDate).toLocaleString()}</p>
          <p>End: {new Date(eventData.endDate).toLocaleString()}</p>
        </div>
        
        {eventData.tags.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700">Tags:</h4>
            <div className="flex flex-wrap gap-2">
              {eventData.tags.map((tag, i) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {eventData.customForm.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700">Custom Fields:</h4>
            <p className="text-sm text-gray-600">{eventData.customForm.length} custom field(s) added</p>
          </div>
        )}

        {eventData.type === 'Merchandise' && (
          <div>
            <h4 className="font-semibold text-gray-700">Merchandise Details:</h4>
            <p className="text-sm text-gray-600">Stock: {eventData.merchandise.stockQuantity} | Limit: {eventData.merchandise.purchaseLimit}/person</p>
            {selectedSizes.length > 0 && <p className="text-sm text-gray-600">Sizes: {selectedSizes.join(', ')}</p>}
            {(eventData.merchandise.colors || []).length > 0 && <p className="text-sm text-gray-600">Colors: {eventData.merchandise.colors.join(', ')}</p>}
            {eventData.merchandise.variants.length > 0 && <p className="text-sm text-gray-600">Variants: {eventData.merchandise.variants.map(v => v.name).join(', ')}</p>}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          📝 Your event will be created as a <strong>Draft</strong>. You can edit it and publish when ready.
        </p>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setStep(3)}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          ← Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? 'Creating...' : '✓ Create Event'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/organizer/dashboard')}
          className="mb-4 text-blue-600 hover:text-blue-800"
        >
          ← Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Event</h1>
          <p className="text-gray-600 mb-8">Fill in the details to create your event</p>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && (
                  <div
                    className={`h-1 w-20 mx-2 ${
                      step > s ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;
