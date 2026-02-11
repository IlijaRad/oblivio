interface IncomingCallProps {
  type: "video" | "audio";
  callerName: string;
  callerImage?: string;
  onAccept: () => void;
  onReject: () => void;
  onToggle: () => void;
}

export default function IncomingCall({
  type,
  callerName,
  callerImage,
  onAccept,
  onReject,
}: IncomingCallProps) {
  const isVideo = type === "video";
  const bgColor = isVideo ? "bg-blue-500" : "bg-green-500";
  const iconColor = isVideo ? "#005EC9" : "#3CC900";

  const getColorFromName = (name: string) => {
    if (!name) return "#6B7280";
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <div
      className={`
        fixed inset-0 z-1000 flex items-center justify-center bg-black/40
        p-4 sm:p-6
      `}
    >
      <div
        className={`
          relative w-full max-w-[380px] ${bgColor} rounded-xl shadow-2xl
          text-white overflow-hidden
        `}
      >
        <div className="absolute left-5 top-6">
          <h1 className="text-xl font-normal">
            {isVideo ? "Video call" : "Audio call"}
          </h1>
        </div>

        <div className="pt-24 pb-10 flex flex-col items-center">
          <div className="relative w-[167px] h-[163px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[127px] h-[124px] rounded-[31px] border border-white/50" />
              <div className="absolute w-[113px] h-[110px] rounded-[25px] border border-white" />
              <div className="absolute w-[99px]  h-[96px]  rounded-[20px] border-2 border-white" />
              <div className="absolute w-[85px]  h-[82px]  rounded-[14px] border-[3px] border-white" />
              <div className="absolute w-[71px]  h-[68px]  rounded-[9px]  border-[4px] border-white" />
              <div className="absolute w-[57px]  h-[54px]  rounded-[5px]  border-[5px] border-white" />
            </div>

            <div className="absolute inset-[37px] w-[93px] h-[89px]">
              <div className="w-full h-full rounded-[5px] bg-white" />
              {isVideo ? (
                <svg
                  className="absolute left-[19px] top-4"
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.1996 11.2C8.11086 11.2 5.59961 13.7113 5.59961 16.8V39.2C5.59961 42.2888 8.11086 44.8 11.1996 44.8H33.5996C36.6884 44.8 39.1996 42.2888 39.1996 39.2V16.8C39.1996 13.7113 36.6884 11.2 33.5996 11.2H11.1996ZM43.3996 35L49.8309 40.145C50.1984 40.4425 50.6534 40.6 51.1259 40.6C52.2721 40.6 53.1996 39.6725 53.1996 38.5263V17.4738C53.1996 16.3275 52.2721 15.4 51.1259 15.4C50.6534 15.4 50.1984 15.5575 49.8309 15.855L43.3996 21V35Z"
                    fill={iconColor}
                  />
                </svg>
              ) : (
                <svg
                  className="absolute left-[19px] top-4"
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M19.5476 7.7597C18.8589 6.11185 17.0628 5.23998 15.3539 5.70207L14.8744 5.83285C9.24207 7.36735 4.42932 12.8253 5.83304 19.469C9.0677 34.7268 21.0734 46.7325 36.3312 49.9672C42.9836 51.3796 48.4329 46.5581 49.9674 40.9258L50.0981 40.4463C50.5689 38.7287 49.6884 36.9326 48.0492 36.2526L39.5659 32.7215C38.1273 32.1199 36.462 32.5384 35.4681 33.7503L32.1026 37.8655C25.9734 34.8227 21.0385 29.7309 18.2049 23.4796L22.0586 20.3409C23.2705 19.3556 23.6803 17.6904 23.0874 16.243L19.5476 7.7597Z"
                    fill={iconColor}
                  />
                </svg>
              )}
            </div>

            <div
              className="absolute inset-[37px] w-[93px] h-[89px] rounded-[5px] overflow-hidden flex items-center justify-center text-white text-3xl font-medium select-none"
              style={{ backgroundColor: getColorFromName(callerName) }}
            >
              {callerImage ? (
                <img
                  src={callerImage}
                  alt={callerName}
                  className="w-full h-full object-cover"
                />
              ) : (
                callerName
                  .split(" ")
                  .map((word) => word[0]?.toUpperCase())
                  .slice(0, 2)
                  .join("") || "?"
              )}
            </div>
          </div>

          <h2 className="mt-10 text-2xl font-medium">{callerName}</h2>
          <p className="mt-1.5 text-base opacity-90">Incoming call...</p>
        </div>

        <div className="px-4 pb-8 flex flex-col gap-4">
          <button
            onClick={onAccept}
            className="h-12 rounded-lg bg-white flex items-center justify-center gap-2 hover:opacity-95 active:opacity-90 transition"
          >
            {isVideo ? (
              <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
                <path
                  d="M4.19961 4.20001C3.04133 4.20001 2.09961 5.14173 2.09961 6.30001V14.7C2.09961 15.8583 3.04133 16.8 4.19961 16.8H12.5996C13.7579 16.8 14.6996 15.8583 14.6996 14.7V6.30001C14.6996 5.14173 13.7579 4.20001 12.5996 4.20001H4.19961ZM16.2746 13.125L18.6863 15.0544C18.8241 15.1659 18.9948 15.225 19.172 15.225C19.6018 15.225 19.9496 14.8772 19.9496 14.4474V6.55267C19.9496 6.12282 19.6018 5.77501 19.172 5.77501C18.9948 5.77501 18.8241 5.83407 18.6863 5.94564L16.2746 7.87501V13.125Z"
                  fill={iconColor}
                />
              </svg>
            ) : (
              <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
                <path
                  d="M7.35657 2.92032C7.09735 2.30016 6.42142 1.97204 5.77829 2.14595L5.59782 2.19516C3.47814 2.77266 1.66689 4.82673 2.19517 7.32704C3.41251 13.0692 7.93079 17.5875 13.673 18.8049C16.1766 19.3364 18.2274 17.5219 18.8049 15.4022L18.8541 15.2217C19.0313 14.5753 18.6999 13.8994 18.083 13.6434L14.8903 12.3145C14.3489 12.0881 13.7222 12.2456 13.3481 12.7017L12.0816 14.2505C9.77486 13.1053 7.91767 11.1891 6.85126 8.83641L8.30157 7.65516C8.75767 7.28438 8.91189 6.65766 8.68876 6.11298L7.35657 2.92032Z"
                  fill={iconColor}
                />
              </svg>
            )}
            <span
              className={`font-medium ${isVideo ? "text-[#005EC9]" : "text-[#3CC900]"}`}
            >
              Accept {isVideo ? "video" : "audio"} call
            </span>
          </button>

          <div className="flex gap-4">
            <button
              onClick={onReject}
              className="flex-[2] h-12 rounded-lg bg-white flex items-center justify-center gap-2 hover:opacity-95 active:opacity-90 transition"
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 21 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.77864 2.14594C6.42505 1.96875 7.10099 2.30016 7.35693 2.91703L8.68583 6.10969C8.91224 6.65109 8.75474 7.27781 8.29864 7.65188L6.85161 8.83641C7.91802 11.1858 9.77193 13.102 12.0786 14.2472L13.3485 12.6984C13.7193 12.2423 14.346 12.0881 14.8907 12.3113L18.0801 13.6434C18.6969 13.8994 19.0283 14.5753 18.8511 15.2217L18.8019 15.4022C18.2244 17.5252 16.1736 19.3364 13.6701 18.8081C7.92786 17.5908 3.40958 13.0725 2.19224 7.33031C1.66396 4.82672 3.47521 2.77594 5.59489 2.19516L5.77536 2.14594H5.77864ZM17.9783 3.02203C18.2868 3.33047 18.2868 3.82922 17.9783 4.13438L16.8627 5.25L17.9783 6.36234C18.2868 6.67078 18.2868 7.16953 17.9783 7.47469C17.6699 7.77984 17.1711 7.78313 16.866 7.47469L15.7536 6.36234L14.6413 7.47469C14.3329 7.78313 13.8341 7.78313 13.529 7.47469C13.2238 7.16625 13.2205 6.6675 13.529 6.36234L14.638 5.25L13.5224 4.13766C13.214 3.82922 13.214 3.33047 13.5224 3.02531C13.8308 2.72016 14.3296 2.71688 14.6347 3.02531L15.7504 4.13766L16.8627 3.02203C17.1711 2.71359 17.6699 2.71359 17.975 3.02203H17.9783Z"
                  fill="#C92100"
                />
              </svg>

              <span className="font-medium text-[#C92100]">Reject</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
