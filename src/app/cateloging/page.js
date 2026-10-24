"use client";

import React, { useEffect, useRef, useState } from "react";
import "./Cateloging.scss";
import {
  Box,
  Button,
  CircularProgress,
  Drawer,
  IconButton,
  Modal,
  Typography,
} from "@mui/material";
import {
  FacebookShareButton,
  TwitterShareButton,
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  WhatsappIcon,
  EmailShareButton,
  EmailIcon,
} from "react-share";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { IoMdShareAlt } from "react-icons/io";
import BottomNav from "@/components/BottomNav";
import Header from "@/components/Header";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "80%",
  bgcolor: "background.paper",
  border: "none",
  outline: "none",
  boxShadow: 24,
  p: 4,
};

const checkImageAvailability = (url) => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(false);
      return;
    }
    const img = new window.Image();
    img.src = url;
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
};

const Cateloging = () => {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState();
  const [reportSaleData, setReportSaleData] = useState([]);
  const [imageAvailability, setImageAvailability] = useState({});
  const [checkedImages, setCheckedImages] = useState({});
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [open, setOpen] = useState(false);
  const sentinelRef = useRef(null);

  const handleOpen = (data) => {
    setShareData(data);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("catelogAlbumMasterID", data?.AlbumMasterid);
      sessionStorage.setItem(
        "catelogAlbumMasterName",
        JSON.stringify(data?.albumName)
      );
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  useEffect(() => {
    if (isLoading) {
      setIsSticky(false);
      return;
    }

    const timer = setTimeout(() => {
      const el = sentinelRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setIsSticky(rect.top < 0);
    }, 50);

    return () => clearTimeout(timer);
  }, [isLoading]);

  // Separate observer effect so it re-attaches correctly and cleans up properly
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { rootMargin: "0px", threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedCatelogList = JSON.parse(sessionStorage.getItem("dashboardData"));
    let parsedData = storedCatelogList?.catalogList?.rd
    if (storedCatelogList) {
      setReportSaleData(storedCatelogList?.catalogList?.rd);
      setFilteredData(parsedData);

      parsedData.forEach((item) => {
        const imageUrl = item.ImageToDisplay || item.DefImage;

        checkImageAvailability(imageUrl).then((isAvailable) => {
          setImageAvailability((prevState) => ({
            ...prevState,
            [item.AlbumMasterid]: isAvailable ? imageUrl : null,
          }));

          setCheckedImages((prev) => ({
            ...prev,
            [item.AlbumMasterid]: true,
          }));
        });
      });
    }
  }, []);

  const handleSearch = (event) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (query) {
      const filtered = reportSaleData.filter((item) =>
        item.albumName?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(reportSaleData);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredData(reportSaleData);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const shareUrl = "https://www.example.com";

  const handleNavigate = (data) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("catelogAlbumMasteName", data?.albumName);
      sessionStorage.setItem("catelogAlbumMasterID", data?.AlbumMasterid);
    }
    router.push("/CatelogingDetail");
  };

  return (
    <div className="cataloging_container">
      {isLoading && (
        <div className="loader-overlay">
          <CircularProgress className="loadingBarManage" />
        </div>
      )}
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <p className="choose_textModel">Choose the share option</p>
          <div className="share_option_main_div">
            <Button
              className="Option_share_catelog"
              onClick={() => {
                router.push("/catelogingshare");
                sessionStorage.setItem("catelogsahre", 'share')
              }
              }
            >
              Existing Customer
            </Button>
            <Button
              className="Option_share_catelog"
              onClick={() => {
                router.push("/catelogingshare");
                sessionStorage.setItem("catelogsahre", 'new')
              }}
            >
              New Customer
            </Button>
          </div>
        </Box>
      </Modal>

      {!isLoading && (
        <div>
          <Box sx={{ px: 2, pt: 2, pb: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 0 }}>
              <Box>
                <Typography sx={{ fontSize: 24, fontWeight: 800, color: '#1F2937', letterSpacing: '-0.4px', lineHeight: 1.1 }}>
                  Catalogs
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#9CA3AF', mt: 0.3 }}>
                  {filteredData?.length} album{filteredData?.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
          </Box>
          <div ref={sentinelRef} style={{ height: "1px", marginTop: '10px' }} />
          <div className={`catelog_searchbar ${isSticky ? "sticky" : ""}`}>
            <Box sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              bgcolor: '#fff',
              borderRadius: 3,
              px: 1.5,
              py: 1.25,
              border: '1.5px solid #E5E7EB',
              boxShadow: '0 1px 8px rgba(124,58,237,0.05)',
              '&:focus-within': { borderColor: '#7C3AED', boxShadow: '0 0 0 3px rgba(124,58,237,0.1)' },
              transition: 'all 0.15s',
            }}>
              <Search size={17} color="#9CA3AF" strokeWidth={2.2} />
              <Box
                component="input"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search catalog..."
                sx={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: 14,
                  color: '#1F2937',
                  bgcolor: 'transparent',
                  fontFamily: 'inherit',
                  '&::placeholder': { color: '#C4C9D4' },
                }}
              />
              {searchQuery && (
                <Box onClick={clearSearch} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                  <X size={14} color="#9CA3AF" />
                </Box>
              )}
            </Box>
          </div>
          <div className="catelog_detail_main__div">
            {Array.isArray(reportSaleData) &&
              filteredData.map((data, index) => {
                return (
                  <Button
                    key={data?.AlbumMasterid ?? index}
                    className="catelog_deatil_div"
                    onClick={() => handleNavigate(data)}
                  >
                    <div className="cateloging_sub_div">
                      <div style={{ display: "flex", alignItems: "center" }}>
                            <img
                              src={data.AlbumImagePath}
                              className="catelog_show_img"
                              alt="catalog"
                              onError={data.DefImage}
                            />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                        }}
                      >
                        <p className="catelog_Title_name">{data?.albumName}</p>
                        <p className="ctelog_itemCount">
                          {data?.DesignCnt} Items
                        </p>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpen(data);
                            }}
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                            }}
                          >
                            <IoMdShareAlt
                              style={{
                                height: "25px",
                                width: "25px",
                              }}
                              className="cateloging_share_icone"
                            />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Button>
                );
              })}
          </div>
        </div>
      )}

      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={toggleDrawer}
        className="drawer-container"
      >
        <div className="drawer-content">
          <div
            style={{
              padding: "20px",
              display: "flex",
              justifyContent: "space-around",
            }}
          >
            <FacebookShareButton url={shareUrl}>
              <FacebookIcon size={32} round />
            </FacebookShareButton>
            <TwitterShareButton url={shareUrl}>
              <TwitterIcon size={32} round />
            </TwitterShareButton>
            <WhatsappShareButton url={shareUrl}>
              <WhatsappIcon size={32} round />
            </WhatsappShareButton>
            <EmailShareButton url={shareUrl}>
              <EmailIcon size={32} round />
            </EmailShareButton>
          </div>
        </div>
      </Drawer>
      <BottomNav />
    </div>
  );
};

export default Cateloging;