"use client";

import { useState, useEffect,useRef, FormEvent, ChangeEvent } from "react";
import axios from "axios";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

type FormDataType = {
  name: string;
  email: string;
  phone: string;
  timezone: string;
  cv: File | null;
};

type FormField = "name" | "email" | "phone";

export default function Home() {
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    email: "",
    phone: "",
    timezone: "",
    cv: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    
    
    getTimezone();
  }, []);

  const getTimezone = () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setFormData((prev) => ({
      ...prev,
      timezone
    }));

    console.log("Timezone:", timezone);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "cv" && files) {
      const file = files[0];
      if (file) {
        const fileType = file.name.split(".").pop()?.toLowerCase();
        if (!["pdf", "docx"].includes(fileType || "")) {
          setErrors((prev) => ({
            ...prev,
            cv: "Please upload a PDF or DOCX file",
          }));
          return;
        }
        setFormData((prev) => ({ ...prev, [name]: file }));
        setErrors((prev) => ({ ...prev, cv: "" }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please enter a valid email address";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone.replace(/[\s()-]/g, "")))
      newErrors.phone = "Please enter a valid phone number";
    if (!formData.cv) newErrors.cv = "CV file is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSuccess(null);

    console.log("time-zone", formData.timezone);

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);
      submitData.append("timezone", formData.timezone);
      if (formData.cv) submitData.append("pdf", formData.cv);

      const response = await axios.post(
        "https://chamika31.me:5443/parse_cv",
        submitData
      );
      console.log(response.data);
      setSuccess("CV submitted successfully!");
    } catch (error) {
      console.log("Failed to submit CV", error);

      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data.error;
        setErrors((prev) => ({
          ...prev,
          form: errorMessage || "Failed to submit CV. Please try again.",
        }));
      } else {
        setErrors((prev) => ({
          ...prev,
          form: "Failed to submit CV. Please try again.",
        }));
      }
    } finally {
      setLoading(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        timezone: "",
        cv: null,
      });

      // Reset the file input field
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      getTimezone();
    }
  };

  const formFields: FormField[] = ["name", "email", "phone"];

  return (
    <main className="min-h-screen p-8 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="max-w-lg w-full bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">
          CV Submission
        </h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {formFields.map((field) => (
            <div key={field}>
              <label
                className="block text-sm font-medium text-gray-700 capitalize"
                htmlFor={field}
              >
                {field}
              </label>
              <input
                type={field === "email" ? "email" : "text"}
                id={field}
                name={field}
                value={
                  typeof formData[field as keyof FormDataType] === "string"
                    ? (formData[field as keyof FormDataType] as string)
                    : ""
                }
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 ${
                  errors[field] ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors[field] && (
                <p className="mt-1 text-sm text-red-500">{errors[field]}</p>
              )}
            </div>
          ))}

          <div>
            <label
              htmlFor="cv"
              className="block text-sm font-medium text-gray-700"
            >
              CV (PDF/DOCX)
            </label>
            <input
              type="file"
              id="cv"
              name="cv"
              accept=".pdf,.docx"
              onChange={handleInputChange}
              ref={fileInputRef} // Attach the ref here
              className="w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500"
            />

            {errors.cv && (
              <p className="mt-1 text-sm text-red-500">{errors.cv}</p>
            )}
          </div>

          {errors.form && (
            <p className="text-red-500 text-center">{errors.form}</p>
          )}
          {success && <p className="text-green-500 text-center">{success}</p>}

          <button
            type="submit"
            className="w-full flex justify-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            {loading ? (
              <AiOutlineLoading3Quarters className="animate-spin text-xl" />
            ) : (
              "Submit"
            )}
          </button>
        </form>

      </div>
    </main>
  );
}
