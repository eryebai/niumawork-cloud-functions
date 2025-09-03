/**
 * 牛马Work - LeanCloud云函数
 * 提供软件搜索、验证码生成、广告完成记录等功能
 */

const AV = require('leanengine');

// 初始化软件数据
const INITIAL_SOFTWARE_DATA = [
  {
    name: "Adobe Photoshop 2024",
    category: "图像处理",
    version: "25.0.0",
    size: "2.1GB",
    description: "业界领先的图像编辑软件，提供强大的照片编辑和设计工具。支持RAW格式处理，智能AI功能，专业级色彩管理。",
    features: ["智能AI编辑", "RAW格式支持", "3D设计工具", "视频编辑", "云同步"],
    downloadUrl: "https://example.com/downloads/photoshop-2024.exe",
    tags: ["Adobe", "设计", "图像处理", "专业软件"],
    rating: 4.8,
    downloadCount: 150000,
    status: "active"
  },
  {
    name: "Microsoft Office 2021",
    category: "办公软件", 
    version: "16.0.0",
    size: "3.5GB",
    description: "微软最新办公套件，包含Word、Excel、PowerPoint等应用。提升工作效率，支持云协作和AI助手功能。",
    features: ["Word文档处理", "Excel数据分析", "PowerPoint演示", "Outlook邮件", "Teams协作"],
    downloadUrl: "https://example.com/downloads/office-2021.exe",
    tags: ["Microsoft", "办公", "文档", "表格"],
    rating: 4.6,
    downloadCount: 200000,
    status: "active"
  },
  {
    name: "AutoCAD 2024",
    category: "设计工具",
    version: "24.0.0", 
    size: "1.8GB",
    description: "专业CAD设计软件，适用于建筑、工程、制造等行业。提供精确的2D和3D设计工具。",
    features: ["2D绘图", "3D建模", "参数化设计", "云协作", "移动端支持"],
    downloadUrl: "https://example.com/downloads/autocad-2024.exe",
    tags: ["AutoCAD", "CAD", "设计", "工程"],
    rating: 4.7,
    downloadCount: 80000,
    status: "active"
  },
  {
    name: "Visual Studio Code",
    category: "开发工具",
    version: "1.85.0",
    size: "85MB",
    description: "免费的代码编辑器，支持多种编程语言，丰富的插件生态，内置Git支持和调试功能。",
    features: ["语法高亮", "智能提示", "Git集成", "插件扩展", "调试工具"],
    downloadUrl: "https://example.com/downloads/vscode.exe",
    tags: ["编程", "开发", "编辑器", "免费"],
    rating: 4.9,
    downloadCount: 500000,
    status: "active"
  },
  {
    name: "Chrome浏览器",
    category: "网络工具",
    version: "120.0.0",
    size: "90MB", 
    description: "Google开发的网页浏览器，快速、安全、易用。支持丰富的扩展程序和同步功能。",
    features: ["快速浏览", "安全防护", "扩展支持", "多设备同步", "开发者工具"],
    downloadUrl: "https://example.com/downloads/chrome.exe",
    tags: ["浏览器", "Google", "网络", "免费"],
    rating: 4.5,
    downloadCount: 1000000,
    status: "active"
  },
  {
    name: "WinRAR",
    category: "系统工具",
    version: "6.24",
    size: "3MB",
    description: "强大的压缩解压软件，支持多种压缩格式，压缩率高，操作简便。",
    features: ["多格式支持", "高压缩率", "密码保护", "分卷压缩", "修复功能"],
    downloadUrl: "https://example.com/downloads/winrar.exe", 
    tags: ["压缩", "解压", "工具", "RAR"],
    rating: 4.4,
    downloadCount: 300000,
    status: "active"
  }
];

/**
 * 初始化数据库和数据
 */
AV.Cloud.define('initDatabase', async (request) => {
  try {
    console.log('开始初始化数据库...');

    // 检查并创建软件信息表
    let softwareCount = 0;
    try {
      const SoftwareInfo = AV.Object.extend('SoftwareInfo');
      const query = new AV.Query(SoftwareInfo);
      softwareCount = await query.count();
    } catch (error) {
      console.log('SoftwareInfo表不存在，将创建并初始化数据');
    }

    // 如果没有软件数据，初始化数据
    if (softwareCount === 0) {
      const SoftwareInfo = AV.Object.extend('SoftwareInfo');
      const softwareObjects = INITIAL_SOFTWARE_DATA.map(data => {
        const software = new SoftwareInfo();
        Object.keys(data).forEach(key => {
          software.set(key, data[key]);
        });
        return software;
      });
      
      await AV.Object.saveAll(softwareObjects);
      console.log(`已初始化 ${INITIAL_SOFTWARE_DATA.length} 条软件数据`);
    }

    return {
      success: true,
      message: '数据库初始化完成',
      data: {
        softwareCount: softwareCount || INITIAL_SOFTWARE_DATA.length
      }
    };
  } catch (error) {
    console.error('数据库初始化失败:', error);
    return {
      success: false,
      message: '数据库初始化失败',
      error: error.message
    };
  }
});

/**
 * 搜索软件
 */
AV.Cloud.define('searchSoftware', async (request) => {
  try {
    const { keyword, category, page = 1, limit = 20 } = request.params;
    
    const SoftwareInfo = AV.Object.extend('SoftwareInfo');
    let query = new AV.Query(SoftwareInfo);
    
    // 只返回有效的软件
    query.equalTo('status', 'active');
    
    // 关键词搜索
    if (keyword) {
      const nameQuery = new AV.Query(SoftwareInfo);
      nameQuery.contains('name', keyword);
      
      const descQuery = new AV.Query(SoftwareInfo);
      descQuery.contains('description', keyword);
      
      const tagQuery = new AV.Query(SoftwareInfo);
      tagQuery.containsAll('tags', [keyword]);
      
      query = AV.Query.or(nameQuery, descQuery, tagQuery);
      query.equalTo('status', 'active');
    }
    
    // 分类筛选
    if (category) {
      query.equalTo('category', category);
    }
    
    // 分页
    query.skip((page - 1) * limit);
    query.limit(limit);
    query.descending('downloadCount');
    
    const results = await query.find();
    const total = await query.count();
    
    // 转换为JSON格式
    const softwareList = results.map(item => {
      const data = item.toJSON();
      return {
        id: data.objectId,
        name: data.name,
        category: data.category,
        version: data.version,
        size: data.size,
        description: data.description.substring(0, 100) + '...', // 简短描述
        rating: data.rating,
        downloadCount: data.downloadCount,
        tags: data.tags || []
      };
    });
    
    return {
      success: true,
      data: {
        results: softwareList,
        total,
        page,
        limit,
        hasMore: page * limit < total
      }
    };
  } catch (error) {
    console.error('搜索软件失败:', error);
    return {
      success: false,
      message: '搜索失败，请重试',
      error: error.message
    };
  }
});

/**
 * 获取软件详情
 */
AV.Cloud.define('getSoftwareDetail', async (request) => {
  try {
    const { softwareId, userId } = request.params;
    
    if (!softwareId) {
      return {
        success: false,
        message: '软件ID不能为空'
      };
    }
    
    // 检查用户是否已观看广告
    if (userId) {
      const AdCompletion = AV.Object.extend('AdCompletion');
      const adQuery = new AV.Query(AdCompletion);
      adQuery.equalTo('userId', userId);
      adQuery.equalTo('adType', 'detail');
      adQuery.equalTo('softwareId', softwareId);
      adQuery.greaterThan('createdAt', new Date(Date.now() - 24 * 60 * 60 * 1000)); // 24小时内
      
      const adCompletion = await adQuery.first();
      if (!adCompletion) {
        return {
          success: false,
          message: '请先观看广告后查看详情',
          requireAd: true
        };
      }
    }
    
    // 获取软件详情
    const SoftwareInfo = AV.Object.extend('SoftwareInfo');
    const query = new AV.Query(SoftwareInfo);
    const software = await query.get(softwareId);
    
    if (!software) {
      return {
        success: false,
        message: '软件不存在'
      };
    }
    
    const data = software.toJSON();
    return {
      success: true,
      data: {
        id: data.objectId,
        name: data.name,
        category: data.category,
        version: data.version,
        size: data.size,
        description: data.description,
        features: data.features || [],
        downloadUrl: data.downloadUrl,
        tags: data.tags || [],
        rating: data.rating,
        downloadCount: data.downloadCount
      }
    };
  } catch (error) {
    console.error('获取软件详情失败:', error);
    return {
      success: false,
      message: '获取详情失败，请重试',
      error: error.message
    };
  }
});

/**
 * 生成验证码
 */
AV.Cloud.define('generateAuthCode', async (request) => {
  try {
    const { userId } = request.params;
    
    if (!userId) {
      return {
        success: false,
        message: '用户ID不能为空'
      };
    }
    
    // 检查今日是否已生成过验证码
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const AuthCode = AV.Object.extend('AuthCode');
    const query = new AV.Query(AuthCode);
    query.equalTo('userId', userId);
    query.greaterThanOrEqualTo('createdAt', today);
    query.lessThan('createdAt', tomorrow);
    
    const existingCode = await query.first();
    if (existingCode) {
      const data = existingCode.toJSON();
      return {
        success: true,
        data: {
          code: data.code,
          expiryTime: '23:59:59',
          isNew: false,
          message: '今日验证码已生成'
        }
      };
    }
    
    // 生成新的验证码
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 保存到数据库
    const authCode = new AuthCode();
    authCode.set('userId', userId);
    authCode.set('code', code);
    authCode.set('status', 'active');
    authCode.set('expiryDate', tomorrow);
    
    await authCode.save();
    
    return {
      success: true,
      data: {
        code: code,
        expiryTime: '23:59:59',
        isNew: true,
        message: '验证码生成成功'
      }
    };
  } catch (error) {
    console.error('生成验证码失败:', error);
    return {
      success: false,
      message: '生成验证码失败，请重试',
      error: error.message
    };
  }
});

/**
 * 验证验证码
 */
AV.Cloud.define('validateAuthCode', async (request) => {
  try {
    const { code, userId } = request.params;
    
    if (!code) {
      return {
        success: false,
        message: '验证码不能为空'
      };
    }
    
    const AuthCode = AV.Object.extend('AuthCode');
    const query = new AV.Query(AuthCode);
    query.equalTo('code', code.toUpperCase());
    query.equalTo('status', 'active');
    
    if (userId) {
      query.equalTo('userId', userId);
    }
    
    const authCode = await query.first();
    
    if (!authCode) {
      return {
        success: false,
        message: '验证码无效或已过期'
      };
    }
    
    // 检查是否过期
    const now = new Date();
    const expiryDate = authCode.get('expiryDate');
    
    if (now >= expiryDate) {
      return {
        success: false,
        message: '验证码已过期'
      };
    }
    
    return {
      success: true,
      message: '验证码验证成功',
      data: {
        code: authCode.get('code'),
        userId: authCode.get('userId')
      }
    };
  } catch (error) {
    console.error('验证验证码失败:', error);
    return {
      success: false,
      message: '验证失败，请重试',
      error: error.message
    };
  }
});

/**
 * 记录广告观看完成
 */
AV.Cloud.define('recordAdCompletion', async (request) => {
  try {
    const { userId, adType, softwareId, watchProgress } = request.params;
    
    if (!userId || !adType) {
      return {
        success: false,
        message: '参数不完整'
      };
    }
    
    // 检查观看进度是否达标
    if (watchProgress < 80) {
      return {
        success: false,
        message: '广告观看不完整，请重新观看'
      };
    }
    
    // 检查是否已记录过（防止重复）
    const AdCompletion = AV.Object.extend('AdCompletion');
    const query = new AV.Query(AdCompletion);
    query.equalTo('userId', userId);
    query.equalTo('adType', adType);
    
    if (softwareId) {
      query.equalTo('softwareId', softwareId);
    }
    
    query.greaterThan('createdAt', new Date(Date.now() - 60 * 60 * 1000)); // 1小时内
    
    const existing = await query.first();
    if (existing) {
      return {
        success: true,
        message: '广告观看记录已存在',
        data: { alreadyExists: true }
      };
    }
    
    // 记录广告观看完成
    const completion = new AdCompletion();
    completion.set('userId', userId);
    completion.set('adType', adType);
    completion.set('watchProgress', watchProgress);
    completion.set('status', 'completed');
    
    if (softwareId) {
      completion.set('softwareId', softwareId);
    }
    
    await completion.save();
    
    return {
      success: true,
      message: '广告观看记录保存成功',
      data: {
        adType,
        watchProgress,
        completedAt: new Date()
      }
    };
  } catch (error) {
    console.error('记录广告完成失败:', error);
    return {
      success: false,
      message: '记录失败，请重试',
      error: error.message
    };
  }
});

/**
 * 获取软件列表（用于下载页面）
 */
AV.Cloud.define('getSoftwareList', async (request) => {
  try {
    const { category, page = 1, limit = 50 } = request.params;
    
    const SoftwareInfo = AV.Object.extend('SoftwareInfo');
    const query = new AV.Query(SoftwareInfo);
    
    query.equalTo('status', 'active');
    
    if (category) {
      query.equalTo('category', category);
    }
    
    query.skip((page - 1) * limit);
    query.limit(limit);
    query.descending('downloadCount');
    
    const results = await query.find();
    
    // 获取所有分类
    const categoryQuery = new AV.Query(SoftwareInfo);
    categoryQuery.equalTo('status', 'active');
    categoryQuery.select('category');
    const allSoftware = await categoryQuery.find();
    const categories = [...new Set(allSoftware.map(item => item.get('category')))];
    
    const softwareList = results.map(item => {
      const data = item.toJSON();
      return {
        id: data.objectId,
        name: data.name,
        category: data.category,
        version: data.version,
        size: data.size,
        description: data.description.substring(0, 80) + '...',
        downloadUrl: data.downloadUrl,
        rating: data.rating,
        downloadCount: data.downloadCount,
        tags: data.tags || []
      };
    });
    
    return {
      success: true,
      data: {
        results: softwareList,
        categories: categories.sort(),
        total: await query.count(),
        page,
        limit
      }
    };
  } catch (error) {
    console.error('获取软件列表失败:', error);
    return {
      success: false,
      message: '获取列表失败，请重试',
      error: error.message
    };
  }
});

module.exports = AV.Cloud;
