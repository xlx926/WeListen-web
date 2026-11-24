from flask import Blueprint, request

from project.services.recommend_service import RecommendService
from project.utils.auth import login_required, current_user_id
from project.utils.response import error, success

recommend_bp = Blueprint("recommend", __name__)
service = RecommendService()


@recommend_bp.route("/guess", methods=["POST"])
@login_required
def guess_you_like():
    """猜你喜欢：基于最近播放与偏好，由 DeepSeek 推荐歌曲"""
    data = request.get_json(silent=True) or {}
    platform = data.get("platform") or ""
    limit = min(int(data.get("limit", 8)), 12)

    result, err = service.guess_you_like(current_user_id(), platform, limit)
    if err:
        return error(err, code=400)
    return success(result)


@recommend_bp.route("/prompt", methods=["POST"])
@login_required
def recommend_by_prompt():
    """按用户需求描述，由 DeepSeek 推荐歌曲"""
    data = request.get_json(silent=True) or {}
    prompt = data.get("prompt") or data.get("query") or ""
    platform = data.get("platform") or ""
    limit = min(int(data.get("limit", 8)), 12)

    result, err = service.recommend_by_prompt(current_user_id(), prompt, platform, limit)
    if err:
        return error(err, code=400)
    return success(result)
