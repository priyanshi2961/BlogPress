import React from "react";

const Footer = () => {
  return (
    <footer className="mt-16 border-t bg-white/60 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} BlogPress. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <a href="#" className="hover:text-gray-700">
              Privacy
            </a>
            <a href="#" className="hover:text-gray-700">
              Terms
            </a>
            <a href="#" className="hover:text-gray-700">
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
