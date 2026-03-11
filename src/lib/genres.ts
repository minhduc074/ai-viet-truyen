import { Genre } from "@/types";

export const GENRES: Genre[] = [
  {
    id: "kiem-hiep",
    name: "Kiếm Hiệp",
    description: "Giang hồ hiểm ác, kiếm pháp tung hoành. Hành trình trở thành đại hiệp.",
    icon: "⚔️",
    color: "from-red-500 to-orange-500",
  },
  {
    id: "tien-hiep",
    name: "Tiên Hiệp",
    description: "Tu tiên đắc đạo, vượt qua kiếp nạn. Hành trình phi thăng thành tiên.",
    icon: "🏔️",
    color: "from-purple-500 to-blue-500",
  },
  {
    id: "do-thi",
    name: "Đô Thị",
    description: "Cuộc sống đô thị hiện đại với những bí ẩn và cơ hội bất ngờ.",
    icon: "🏙️",
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "huyen-huyen",
    name: "Huyền Huyễn",
    description: "Thế giới phép thuật kỳ bí, sinh vật huyền thoại và cuộc phiêu lưu vĩ đại.",
    icon: "✨",
    color: "from-violet-500 to-purple-500",
  },
  {
    id: "khoa-hoc-vien-tuong",
    name: "Khoa Học Viễn Tưởng",
    description: "Tương lai xa xôi, công nghệ tiên tiến và những cuộc phiêu lưu giữa các vì sao.",
    icon: "🚀",
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "trinh-tham",
    name: "Trinh Thám",
    description: "Giải mã bí ẩn, truy tìm kẻ phạm tội. Mỗi manh mối là một bước tiến.",
    icon: "🔍",
    color: "from-amber-500 to-yellow-500",
  },
  {
    id: "kinh-di",
    name: "Kinh Dị",
    description: "Bóng tối rình rập, nỗi sợ hiện hữu. Liệu bạn có sống sót?",
    icon: "👻",
    color: "from-gray-700 to-gray-900",
  },
  {
    id: "lang-man",
    name: "Lãng Mạn",
    description: "Tình yêu nở rộ giữa muôn vàn thử thách và hiểu lầm.",
    icon: "💕",
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "phieu-luu",
    name: "Phiêu Lưu",
    description: "Khám phá vùng đất mới, đối mặt hiểm nguy và thu thập kho báu.",
    icon: "🗺️",
    color: "from-emerald-500 to-green-500",
  },
  {
    id: "lich-su",
    name: "Lịch Sử",
    description: "Xuyên không về quá khứ, thay đổi vận mệnh lịch sử.",
    icon: "📜",
    color: "from-yellow-600 to-amber-700",
  },
];

export function getGenreById(id: string): Genre | undefined {
  return GENRES.find((g) => g.id === id);
}

export function getGenreByName(name: string): Genre | undefined {
  return GENRES.find((g) => g.name === name);
}
