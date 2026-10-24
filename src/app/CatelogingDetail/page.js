'use client';

import React, { useEffect, useRef, useState } from "react";
import "./CatelogingDetail.scss";
import { Box, CircularProgress, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import { IoMdClose } from "react-icons/io";
import { FaFilter } from "react-icons/fa";
import { Catelog_AlbumDesignList } from "@/Utils/API/Catelog_AlbumDesignList/Catelog_AlbumDesignList";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search } from "lucide-react";

const CatelogingDetail = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [cateLogDeatilData, setCateLogDeatilData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const searchBarRef = useRef(null);
  const [isSticky, setIsSticky] = useState(false);
  const [filters, setFilters] = useState({
    CustomerCode: "",
    Email: "",
    FullName: "",
    MobileNo: "",
  });
  const router = useRouter();
  const [selectedName, setSelectedName] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem("catelogAlbumMasterName");
    if (stored) {
      try {
        setSelectedName(JSON.parse(stored) || "");
      } catch {
        setSelectedName(stored);
      }
    }
  }, []);
  // Prevent loading timeout
  useEffect(() => {
    let timeout;
    if (isLoading) {
      timeout = setTimeout(() => {
        setIsLoading(false);
      }, 10000); // Stops loading automatically after 10 seconds
    }
    return () => clearTimeout(timeout);
  }, [isLoading]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 120) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchBarRef.current &&
        !searchBarRef.current.contains(event.target)
      ) {
        setShowSearchBar(false);
      }
    };

    if (showSearchBar) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchBar]);

  useEffect(() => {
    setIsLoading(true);
    let isMounted = true; // Track component mount status
    let Id = sessionStorage.getItem("catelogAlbumMasterID");
    Catelog_AlbumDesignList("Catelog_AlbumDesignList", Id)
      .then((response) => {
        if (isMounted) {
          setIsLoading(false);
          if (response?.Data?.rd) {
            setCateLogDeatilData(response?.Data?.rd);
          }
        }
      })
      .catch((err) => {
        console.error(err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false; // Clean up on unmount
    };
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      CustomerCode: "",
      Email: "",
      FullName: "",
      MobileNo: "",
    });
    setShowSearchBar(false);
  };

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const clearSearch = () => {
    setSearchQuery(""); // Clears the search input
  };

  const filteredData = cateLogDeatilData.filter((data) => {
    const matchesSearch = data.DesignNo?.toLowerCase().includes(
      searchQuery.toLowerCase()
    );
    const matchesFilters =
      (!filters.CustomerCode ||
        data.CategoryName?.toLowerCase().includes(
          filters.CustomerCode.toLowerCase()
        )) &&
      (!filters.Email ||
        data.CollectionName?.toLowerCase().includes(
          filters.Email.toLowerCase()
        )) &&
      (!filters.FullName ||
        data.MakeTypeName?.toLowerCase().includes(
          filters.FullName.toLowerCase()
        )) &&
      (!filters.MobileNo ||
        data.MetalColorName?.toLowerCase().includes(
          filters.MobileNo.toLowerCase()
        ));

    return matchesSearch && matchesFilters;
  });

  const isAnyFilterEntered = Object.values(filters).some(
    (value) => value.trim() !== ""
  );

  const handleOpenFilter = () => {
    setShowSearchBar(!showSearchBar);
  };

  return (
    <div className="cateLogDetail_Main">

      {isLoading && (
        <div className="loader-overlay">
          <CircularProgress className="loadingBarManage" />
        </div>
      )}

      {!isLoading && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, bgcolor: 'white' }}>
            <Box
              onClick={() => router.back()}
              sx={{
                width: 36, height: 36, borderRadius: '50%', bgcolor: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 6px rgba(124,58,237,0.1)', cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                '&:active': { transform: 'scale(0.9)' }, transition: 'transform 0.15s',
              }}
            >
              <ArrowLeft size={20} color="#1F2937" />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedName || 'Catalog Details'}
              </Typography>
              <Typography sx={{ fontSize: 12, color: '#6B7280' }}>
                {cateLogDeatilData?.length ?? 0} Products
              </Typography>
            </Box>
          </Box>
          <Box className={`catelog_searchmain_bar ${isSticky ? "sticky" : ""}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1 }}>
            <TextField
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search design..."
              fullWidth
              variant="outlined"
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} color="#9CA3AF" />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery ? (
                    <InputAdornment position="end">
                      <IconButton onClick={clearSearch} size="small">
                        <IoMdClose />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
              sx={{ bgcolor: '#fff', borderRadius: 2 }}
            />
            <FaFilter
              className="Filter_icone_catelog"
              onClick={handleOpenFilter}
              style={{ flexShrink: 0, fontSize: 22, cursor: 'pointer' }}
            />
          </Box>
          <div className="all_catelog_detail_view">
            {Array.isArray(filteredData) && filteredData.length > 0 ? (
              filteredData.map((data, index) => (
                <div className="catelog_deatil_div" key={index}>
                  <div className="cateloging_sub_div">
                    <div className="catelog_Image_main_div">
                      <img
                        src={data?.ImagePath}
                        className="catelog_deatil_image"
                        onError={(e) => {
                          e.target.src = data?.DefImage;
                        }}
                      />
                      <div
                        style={{
                          width: "100%",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginRight: "10px",
                          }}
                        >
                          <p className="catelog_Title_name">{data?.DesignNo}</p>
                          <p style={{ margin: "0px", fontSize: "13px" }}>
                            {data?.CategoryName}
                          </p>
                        </div>
                        <div className="catelogin_sub_deatil_div">
                          <p className="cat_deatil_title">
                            GW :{" "}
                            <span className="cat_dezatil_value">
                              {data?.ActualGrossWt}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="cat_deatil_title">
                            NW :{" "}
                            <span className="cat_dezatil_value">
                              {data?.MetalWt}
                            </span>
                          </p>
                        </div>
                        {data?.DiamondWt !== 0 && (
                          <div>
                            <p className="cat_deatil_title">
                              DiaWt :{" "}
                              <span className="cat_dezatil_value">
                                {data?.DiamondWt}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p>No results found</p>
            )}
          </div>
          <div
            ref={searchBarRef}
            className={`search_bar_cateloging ${showSearchBar ? "open" : ""}`}
          >
            <div className="search_box_container_top_div">
              {isAnyFilterEntered ? (
                <p className="filter_text_clear" onClick={handleClearFilters}>
                  Clear Filter
                </p>
              ) : (
                <p className="filter_text">Filter Data</p>
              )}
              <p
                className="filter_close_text"
                onClick={() => setShowSearchBar(false)}
              >
                Close
              </p>
            </div>
            <div className="search_box_container_div">
              <TextField
                placeholder="CategoryName"
                value={filters.CustomerCode}
                onChange={(e) =>
                  handleFilterChange("CustomerCode", e.target.value)
                }
              />
              <TextField
                placeholder="CollectionName"
                value={filters.Email}
                onChange={(e) => handleFilterChange("Email", e.target.value)}
              />
            </div>
            <div className="search_box_container_div">
              <TextField
                placeholder="MakeTypeName"
                value={filters.FullName}
                onChange={(e) => handleFilterChange("FullName", e.target.value)}
              />
              <TextField
                placeholder="MetalColorName"
                value={filters.MobileNo}
                onChange={(e) =>
                  handleFilterChange("MobileNo", e.target.value)
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CatelogingDetail;




// import React, { useEffect, useRef, useState } from "react";
// import "./CatelogingDetail.scss";
// import { Catelog_AlbumDesignList } from "../../../../Utils/API/Catelog_AlbumDesignList/Catelog_AlbumDesignList";
// import { CircularProgress, IconButton } from "@mui/material";
// import { IoMdClose } from "react-icons/io";
// import TextField from "../../../TextFiled/Index";
// import { FaFilter } from "react-icons/fa";

// const CatelogingDetail = () => {
//   const [isLoading, setIsLoading] = useState(false);
//   const [cateLogDeatilData, setCateLogDeatilData] = useState([]);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [showSearchBar, setShowSearchBar] = useState(false);
//   const searchBarRef = useRef(null);
//   const [isSticky, setIsSticky] = useState(false);
//   const [filters, setFilters] = useState({
//     CustomerCode: "",
//     Email: "",
//     FullName: "",
//     MobileNo: "",
//   });

//   useEffect(() => {
//     const handleScroll = () => {
//       if (window.scrollY > 120) {
//         setIsSticky(true);
//       } else {
//         setIsSticky(false);
//       }
//     };
//     window.addEventListener("scroll", handleScroll);
//     return () => window.removeEventListener("scroll", handleScroll);
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         searchBarRef.current &&
//         !searchBarRef.current.contains(event.target)
//       ) {
//         setShowSearchBar(false);
//       }
//     };

//     if (showSearchBar) {
//       document.addEventListener("mousedown", handleClickOutside);
//     } else {
//       document.removeEventListener("mousedown", handleClickOutside);
//     }

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [showSearchBar]);

//   useEffect(() => {
//     setIsLoading(true);
//     let Id = sessionStorage.getItem("catelogAlbumMasterID");
//     Catelog_AlbumDesignList("Catelog_AlbumDesignList", Id)
//       .then((response) => {
//         setIsLoading(false);
//         if (response?.Data?.DT) {
//           setCateLogDeatilData(response?.Data?.DT);
//         }
//       })
//       .catch((err) => {
//         console.error(err);
//         setIsLoading(false);
//       });
//   }, []);

//   const handleFilterChange = (key, value) => {
//     setFilters((prevFilters) => ({
//       ...prevFilters,
//       [key]: value,
//     }));
//   };

//   const handleClearFilters = () => {
//     setFilters({
//       CustomerCode: "",
//       Email: "",
//       FullName: "",
//       MobileNo: "",
//     });
//     setShowSearchBar(false);
//   };

//   const handleSearch = (event) => {
//     setSearchQuery(event.target.value);
//   };

//   const clearSearch = () => {
//     setSearchQuery(""); // Clears the search input
//   };

//   const filteredData = cateLogDeatilData.filter((data) => {
//     const matchesSearch = data.DesignNo?.toLowerCase().includes(
//       searchQuery.toLowerCase()
//     );
//     const matchesFilters =
//       (!filters.CustomerCode ||
//         data.CategoryName?.toLowerCase().includes(
//           filters.CustomerCode.toLowerCase()
//         )) &&
//       (!filters.Email ||
//         data.CollectionName?.toLowerCase().includes(
//           filters.Email.toLowerCase()
//         )) &&
//       (!filters.FullName ||
//         data.MakeTypeName?.toLowerCase().includes(
//           filters.FullName.toLowerCase()
//         )) &&
//       (!filters.MobileNo ||
//         data.MetalColorName?.toLowerCase().includes(
//           filters.MobileNo.toLowerCase()
//         ));

//     return matchesSearch && matchesFilters;
//   });

//   const isAnyFilterEntered = Object.values(filters).some(
//     (value) => value.trim() !== ""
//   );

//   const handleOpenFilter = () => {
//     setShowSearchBar(!showSearchBar);
//   };
//   return (
//     <div className="cateLogDetail_Main">
//       {isLoading && (
//         <div className="loader-overlay">
//           <CircularProgress className="loadingBarManage" />
//         </div>
//       )}
//       {!isLoading && (
//         <>
//           <div className="cateLogDetail_TopBtn">
//             <p className="Catelog_OrderCount">
//               <span>{cateLogDeatilData[0]?.CollectionName}</span>
//               <span>{cateLogDeatilData?.length} Products</span>
//             </p>
//           </div>
//           <div className={`catelog_searchmain_bar ${isSticky ? "sticky" : ""}`}>
//             <TextField
//               value={searchQuery}
//               onChange={handleSearch}
//               placeholder="Search ...."
//               InputProps={{
//                 endAdornment: searchQuery && (
//                   <IconButton onClick={clearSearch}>
//                     <IoMdClose />
//                   </IconButton>
//                 ),
//               }}
//               className="catelog_deatil_top_searhcBox"
//             />

//             <FaFilter
//               className="Filter_icone_catelog"
//               onClick={handleOpenFilter}
//             />
//           </div>
//           <div className="all_catelog_detail_view">
//             {Array.isArray(filteredData) && filteredData.length > 0 ? (
//               filteredData.map((data, index) => (
//                 <div className="catelog_deatil_div" key={index}>
//                   <div className="cateloging_sub_div">
//                     <div className="catelog_Image_main_div">
//                       <img
//                         src={data?.ImagePath}
//                         className="catelog_deatil_image"
//                         onError={(e) => {
//                           e.target.src = data?.DefImage;
//                         }}
//                       />
//                       <div
//                         style={{
//                           width: "100%",
//                           display: "flex",
//                           flexDirection: "column",
//                           justifyContent: "center",
//                         }}
//                       >
//                         <div
//                           style={{
//                             display: "flex",
//                             justifyContent: "space-between",
//                             alignItems: "center",
//                             marginRight: "10px",
//                           }}
//                         >
//                           <p className="catelog_Title_name">{data?.DesignNo}</p>
//                           <p style={{ margin: "0px", fontSize: "13px" }}>
//                             {data?.CategoryName}
//                           </p>
//                         </div>
//                         <div className="catelogin_sub_deatil_div">
//                           <p className="cat_deatil_title">
//                             GW :{" "}
//                             <span className="cat_dezatil_value">
//                               {data?.ActualGrossWt}
//                             </span>
//                           </p>
//                         </div>
//                         <div>
//                           <p className="cat_deatil_title">
//                             NW :{" "}
//                             <span className="cat_dezatil_value">
//                               {data?.MetalWt}
//                             </span>
//                           </p>
//                         </div>
//                         {data?.DiamondWt !== 0 && (
//                           <div>
//                             <p className="cat_deatil_title">
//                               DiaWt :{" "}
//                               <span className="cat_dezatil_value">
//                                 {data?.DiamondWt}
//                               </span>
//                             </p>
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ))
//             ) : (
//               <p>No results found</p>
//             )}
//           </div>
//           <div
//             ref={searchBarRef}
//             className={`search_bar_cateloging ${showSearchBar ? "open" : ""}`}
//           >
//             <div className="search_box_container_top_div">
//               {isAnyFilterEntered ? (
//                 <p className="filter_text_clear" onClick={handleClearFilters}>
//                   Clear Filter
//                 </p>
//               ) : (
//                 <p className="filter_text">Filter Data</p>
//               )}
//               <p
//                 className="filter_close_text"
//                 onClick={() => setShowSearchBar(false)}
//               >
//                 Close
//               </p>
//             </div>
//             <div className="search_box_container_div">
//               <TextField
//                 placeholder="CategoryName"
//                 value={filters.CustomerCode}
//                 onChange={(e) =>
//                   handleFilterChange("CustomerCode", e.target.value)
//                 }
//               />
//               <TextField
//                 placeholder="CollectionName"
//                 value={filters.Email}
//                 onChange={(e) => handleFilterChange("Email", e.target.value)}
//               />
//             </div>

//             <div className="search_box_container_div">
//               <TextField
//                 placeholder="MakeTypeName"
//                 value={filters.FullName}
//                 onChange={(e) => handleFilterChange("FullName", e.target.value)}
//               />
//               <TextField
//                 placeholder="MetalColorName"
//                 value={filters.MobileNo}
//                 onChange={(e) => handleFilterChange("MobileNo", e.target.value)}
//               />
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default CatelogingDetail;